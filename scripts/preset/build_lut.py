"""
Turn a Lightroom preset (.xmp) into a colour lookup table the app can apply.

Lightroom's engine is closed, so this rebuilds the look from the preset's
numbers: the point curves (master + R/G/B) exactly, and white balance,
exposure, the basic tone sliders, the parametric curve, the HSL mixer,
calibration, vibrance and saturation as close approximations. Sharpening and
noise reduction are skipped.

Output is a 512x512 Hald CLUT PNG (64 steps per channel). The app loads it and
maps every pixel through it. The optional amount (0-100, like Lightroom's preset
Amount slider) blends between the original colours and the full look.

    python3 scripts/preset/build_lut.py scripts/preset/1-lo.xmp client/public/presets/1-lo.png 25
"""
import re
import sys

import numpy as np
from PIL import Image

LEVEL = 8                   # Hald level: LEVEL**2 = 64 steps per channel
N = LEVEL * LEVEL


def read_preset(path):
    xml = open(path, encoding='utf-8').read()
    attrs = {k: v for k, v in re.findall(r'crs:(\w+)="([^"]*)"', xml)}

    def num(name, default=0.0):
        try:
            return float(attrs.get(name, default))
        except ValueError:
            return default

    def curve(name):
        m = re.search(rf'<crs:{name}>\s*<rdf:Seq>(.*?)</rdf:Seq>', xml, re.S)
        if not m:
            return [(0, 0), (255, 255)]
        return [tuple(map(float, p.split(','))) for p in re.findall(r'<rdf:li>([^<]+)</rdf:li>', m.group(1))]

    return num, curve


# ── Colour helpers ──────────────────────────────────────────────────────────

def to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def luma(rgb):
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def bump(x, center, width):
    """Smooth hump that is 1 at center and fades to 0 at center ± width."""
    t = np.clip(1 - np.abs(x - center) / width, 0, 1)
    return t * t * (3 - 2 * t)


def apply_tone(rgb, f):
    """Apply a tone curve to brightness only, keeping each pixel's colour."""
    y = luma(rgb)
    y2 = np.clip(f(y), 0, 1)
    scale = np.where(y > 1e-5, y2 / np.maximum(y, 1e-5), 1.0)
    out = rgb * scale[..., None]
    # Pixels pushed past white desaturate toward white rather than clip hue
    over = np.max(out, axis=-1, keepdims=True)
    return np.where(over > 1, out + (1 - out) * (1 - 1 / np.maximum(over, 1)), out)


def point_curve(points):
    """Monotone cubic through Lightroom curve points; flat beyond the ends."""
    xs = np.array([p[0] for p in points]) / 255
    ys = np.array([p[1] for p in points]) / 255
    d = np.diff(ys) / np.diff(xs)
    m = np.zeros_like(ys)
    m[1:-1] = np.where(d[:-1] * d[1:] > 0, 2 / (1 / d[:-1] + 1 / d[1:]), 0)
    m[0], m[-1] = d[0], d[-1]

    def f(x):
        x = np.clip(x, xs[0], xs[-1])
        i = np.clip(np.searchsorted(xs, x) - 1, 0, len(xs) - 2)
        h = xs[i + 1] - xs[i]
        t = (x - xs[i]) / h
        t2, t3 = t * t, t * t * t
        return ((2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i]
                + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1])
    return f


def rgb_to_hsl(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    l = (mx + mn) / 2
    d = mx - mn
    s = np.where(d < 1e-6, 0, d / np.maximum(1 - np.abs(2 * l - 1), 1e-6))
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dd = np.maximum(d, 1e-6)
    h = np.where(mx == r, ((g - b) / dd) % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) * 60
    return np.where(d < 1e-6, 0, h), np.clip(s, 0, 1), l


def hsl_to_rgb(h, s, l):
    c = (1 - np.abs(2 * l - 1)) * s
    hp = (h % 360) / 60
    x = c * (1 - np.abs(hp % 2 - 1))
    z = np.zeros_like(h)
    seg = np.floor(hp).astype(int) % 6
    r = np.choose(seg, [c, x, z, z, x, c])
    g = np.choose(seg, [x, c, c, x, z, z])
    b = np.choose(seg, [z, z, x, c, c, x])
    m = l - c / 2
    return np.stack([r + m, g + m, b + m], -1)


BANDS = ['Red', 'Orange', 'Yellow', 'Green', 'Aqua', 'Blue', 'Purple', 'Magenta']
CENTERS = np.array([0, 30, 60, 120, 180, 240, 270, 300], float)


def band_weights(h):
    """Weight of each HSL band for each hue, blending between neighbours."""
    w = np.zeros(h.shape + (len(BANDS),))
    ext = np.append(CENTERS, 360)
    for i in range(len(BANDS)):
        lo = CENTERS[-1] - 360 if i == 0 else ext[i - 1]
        c, hi = ext[i], ext[i + 1]
        hh = np.where(h > 330, h - 360, h) if i == 0 else h
        up = np.clip((hh - lo) / (c - lo), 0, 1) * (hh <= c)
        down = np.clip((hi - hh) / (hi - c), 0, 1) * (hh > c)
        w[..., i] = up + down
    return w / np.maximum(w.sum(-1, keepdims=True), 1e-6)


# ── The preset ──────────────────────────────────────────────────────────────

def build(path, amount=100):
    num, curve = read_preset(path)

    g = np.linspace(0, 1, N)
    b_, g_, r_ = np.meshgrid(g, g, g, indexing='ij')   # Hald order: red fastest
    rgb = np.stack([r_, g_, b_], -1).reshape(-1, 3)
    original = rgb.copy()

    # White balance and exposure, in linear light
    lin = to_linear(rgb)
    temp, tint = num('IncrementalTemperature') / 100, num('IncrementalTint') / 100
    lin = lin * np.array([1 + 0.20 * temp, 1 - 0.10 * tint, 1 - 0.28 * temp])
    lin = lin * 2 ** num('Exposure2012')
    rgb = to_srgb(lin)

    # Basic tone sliders
    contrast = num('Contrast2012') / 100
    hi, sh = num('Highlights2012') / 100, num('Shadows2012') / 100
    wh, bl = num('Whites2012') / 100, num('Blacks2012') / 100

    def basic(y):
        y = y + contrast * 0.15 * (y - 0.5) * (1 - np.abs(2 * y - 1))
        y = y + sh * 0.18 * bump(y, 0.28, 0.28) + hi * 0.18 * bump(y, 0.72, 0.28)
        y = y + bl * 0.10 * (1 - y) ** 5 + wh * 0.08 * y ** 5
        return y
    rgb = apply_tone(rgb, basic)

    # Parametric curve: four regions split at the preset's points
    s1, s2, s3 = (num(k) / 100 for k in ('ParametricShadowSplit', 'ParametricMidtoneSplit', 'ParametricHighlightSplit'))
    regions = [(num('ParametricShadows'), 0, s1), (num('ParametricDarks'), s1, s2),
               (num('ParametricLights'), s2, s3), (num('ParametricHighlights'), s3, 1)]

    def parametric(y):
        out = y.copy()
        for amount, lo, hi_ in regions:
            c, w = (lo + hi_) / 2, max((hi_ - lo) / 2 + 0.08, 0.1)
            out = out + amount / 100 * 0.10 * bump(y, c, w) * np.minimum(y, 1 - y) * 4
        return out
    rgb = apply_tone(rgb, parametric)

    # Point curves: master on every channel, then each channel's own
    master = point_curve(curve('ToneCurvePV2012'))
    rgb = master(rgb)
    for i, name in enumerate(['Red', 'Green', 'Blue']):
        rgb[:, i] = point_curve(curve(f'ToneCurvePV2012{name}'))(rgb[:, i])

    # HSL mixer + calibration, by hue band
    h, s, l = rgb_to_hsl(rgb)
    w = band_weights(h)
    hue_adj = np.array([num(f'HueAdjustment{b}') for b in BANDS])
    sat_adj = np.array([num(f'SaturationAdjustment{b}') for b in BANDS])
    lum_adj = np.array([num(f'LuminanceAdjustment{b}') for b in BANDS])
    # Calibration primaries nudge the bands nearest each primary
    cal_hue = np.zeros(8)
    cal_sat = np.zeros(8)
    for prim, idx in (('Red', [0, 1, 7]), ('Green', [3, 4]), ('Blue', [5, 6])):
        cal_hue[idx] += num(f'{prim}Hue') * 0.10
        cal_sat[idx] += num(f'{prim}Saturation') * 0.25

    # Lightroom's mixer is gentler than its slider numbers suggest, and food
    # loses its warmth fast, so these are scaled down to match by eye
    h = h + (w @ (hue_adj + cal_hue)) * 0.12                 # ±100 ≈ ±12°
    s = s * (1 + (w @ (sat_adj + cal_sat)) / 200)
    l = l + (w @ lum_adj) / 100 * 0.12 * s * (1 - np.abs(2 * l - 1))
    s = np.clip(s, 0, 1)

    # Vibrance boosts muted colours most; saturation scales everything
    vib = num('Vibrance') / 100
    s = s + vib * 0.6 * s * (1 - s) ** 1.5
    s = np.clip(s * (1 + num('Saturation') / 100), 0, 1)
    rgb = hsl_to_rgb(h, s, np.clip(l, 0, 1))

    rgb = original + (np.clip(rgb, 0, 1) - original) * (amount / 100)
    return rgb.reshape(N, N, N, 3)


def save_hald(rgb, out):
    size = LEVEL ** 3
    img = (rgb.reshape(size, size, 3) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(img, 'RGB').save(out, optimize=True)


def apply_hald(img, lut):
    """Map an image through the LUT with trilinear interpolation (for previews)."""
    a = np.asarray(img.convert('RGB'), dtype=np.float32) / 255 * (N - 1)
    i0 = np.floor(a).astype(int)
    i1 = np.minimum(i0 + 1, N - 1)
    f = a - i0
    out = 0
    for dr in (0, 1):
        for dg in (0, 1):
            for db in (0, 1):
                ri = i1[..., 0] if dr else i0[..., 0]
                gi = i1[..., 1] if dg else i0[..., 1]
                bi = i1[..., 2] if db else i0[..., 2]
                wr = f[..., 0] if dr else 1 - f[..., 0]
                wg = f[..., 1] if dg else 1 - f[..., 1]
                wb = f[..., 2] if db else 1 - f[..., 2]
                out = out + lut[bi, gi, ri] * (wr * wg * wb)[..., None]
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    amount = float(sys.argv[3]) if len(sys.argv) > 3 else 100
    save_hald(build(src, amount), dst)
    print('wrote', dst)
