import { supabase, PHOTOS_BUCKET } from './supabase'
import { Recipe } from '../types'

/**
 * The photo look: the "1 LO" Lightroom preset at 25%, baked into a Hald CLUT
 * by scripts/preset/build_lut.py. Every pixel is mapped through it.
 */
const LUT_URL = '/presets/1-lo.png'
const LEVEL = 8
const N = LEVEL * LEVEL            // steps per channel
const MAX_SIZE = 2400              // longest side of a graded photo
const QUALITY = 0.9
/** app_state row remembering each graded file's original, so it can be undone */
const ORIGINALS_KEY = 'photo-originals'

type Originals = Record<string, string>

let lutPromise: Promise<Uint8ClampedArray> | null = null

function loadLut(): Promise<Uint8ClampedArray> {
  lutPromise ??= (async () => {
    const img = await createImageBitmap(await (await fetch(LUT_URL)).blob())
    const canvas = new OffscreenCanvas(img.width, img.height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, img.width, img.height).data
  })()
  return lutPromise
}

/** Returns the photo with the preset applied, as a JPEG. */
export async function applyPreset(source: Blob): Promise<Blob> {
  const [lut, img] = await Promise.all([loadLut(), createImageBitmap(source)])
  const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const frame = ctx.getImageData(0, 0, w, h)
  const px = frame.data
  const k = (N - 1) / 255

  // Trilinear lookup; in the Hald image red runs fastest, then green, then blue
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i] * k, g = px[i + 1] * k, b = px[i + 2] * k
    const r0 = r | 0, g0 = g | 0, b0 = b | 0
    const r1 = Math.min(r0 + 1, N - 1), g1 = Math.min(g0 + 1, N - 1), b1 = Math.min(b0 + 1, N - 1)
    const fr = r - r0, fg = g - g0, fb = b - b0
    for (let c = 0; c < 3; c++) {
      const at = (ri: number, gi: number, bi: number) => lut[((bi * N + gi) * N + ri) * 4 + c]
      const c00 = at(r0, g0, b0) + (at(r1, g0, b0) - at(r0, g0, b0)) * fr
      const c10 = at(r0, g1, b0) + (at(r1, g1, b0) - at(r0, g1, b0)) * fr
      const c01 = at(r0, g0, b1) + (at(r1, g0, b1) - at(r0, g0, b1)) * fr
      const c11 = at(r0, g1, b1) + (at(r1, g1, b1) - at(r0, g1, b1)) * fr
      const c0 = c00 + (c10 - c00) * fg
      const c1 = c01 + (c11 - c01) * fg
      px[i + c] = c0 + (c1 - c0) * fb
    }
  }

  ctx.putImageData(frame, 0, 0)
  return canvas.convertToBlob({ type: 'image/jpeg', quality: QUALITY })
}

async function loadOriginals(): Promise<Originals> {
  if (!supabase) return {}
  const { data } = await supabase.from('app_state').select('value').eq('key', ORIGINALS_KEY).maybeSingle()
  return (data?.value as Originals | undefined) ?? {}
}

async function saveOriginals(map: Originals) {
  if (!supabase) return
  const { error } = await supabase.from('app_state').upsert({ key: ORIGINALS_KEY, value: map, updated_at: new Date().toISOString() })
  if (error) throw error
}

async function gradeUrl(folderId: string, url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Couldn't download ${url}`)
  return storeGraded(folderId, await applyPreset(await res.blob()))
}

async function storeGraded(folderId: string, graded: Blob): Promise<string> {
  const path = `${folderId}/graded-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`
  const { error } = await supabase!.storage.from(PHOTOS_BUCKET).upload(path, graded, { contentType: 'image/jpeg' })
  if (error) throw error
  return supabase!.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Grades a freshly uploaded photo and remembers its original. Returns the graded URL. */
export async function gradeUploaded(folderId: string, originalUrl: string, file: Blob): Promise<string> {
  const graded = await storeGraded(folderId, await applyPreset(file))
  const originals = await loadOriginals()
  originals[graded] = originalUrl
  await saveOriginals(originals)
  return graded
}

type Update = (id: string, updates: Partial<Recipe>) => Promise<void>
type Progress = (done: number, total: number) => void

/**
 * Grades every recipe photo that hasn't been graded yet. Original files stay
 * in storage and are remembered, so restoreAllPhotos can put them back.
 */
export async function gradeAllPhotos(recipes: Recipe[], update: Update, onProgress: Progress) {
  const originals = await loadOriginals()
  const todo = recipes.filter((r) => [r.heroImage, ...r.photos.map((p) => p.url)].some((u) => u && !originals[u]))
  let done = 0
  onProgress(0, todo.length)

  for (const r of todo) {
    // The cover is usually one of the photos too; grade each file once
    const swapped = new Map<string, string>()
    const swap = async (url: string) => {
      if (!url || originals[url]) return url
      if (!swapped.has(url)) swapped.set(url, await gradeUrl(r.id, url))
      return swapped.get(url)!
    }
    const heroImage = await swap(r.heroImage)
    const photos = await Promise.all(r.photos.map(async (p) => ({ ...p, url: await swap(p.url) })))
    await update(r.id, { heroImage, photos })
    swapped.forEach((graded, original) => { originals[graded] = original })
    await saveOriginals(originals)
    onProgress(++done, todo.length)
  }
}

/** Puts every graded photo back to its original file. */
export async function restoreAllPhotos(recipes: Recipe[], update: Update, onProgress: Progress) {
  const originals = await loadOriginals()
  const todo = recipes.filter((r) => [r.heroImage, ...r.photos.map((p) => p.url)].some((u) => originals[u]))
  let done = 0
  onProgress(0, todo.length)

  for (const r of todo) {
    await update(r.id, {
      heroImage: originals[r.heroImage] ?? r.heroImage,
      photos: r.photos.map((p) => ({ ...p, url: originals[p.url] ?? p.url })),
    })
    onProgress(++done, todo.length)
  }
}
