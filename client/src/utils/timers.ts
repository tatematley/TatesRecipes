export interface Duration {
  /** Text as written in the step, e.g. "11 to 12 minutes" */
  label: string
  /** Seconds for the timer; ranges use the upper bound */
  seconds: number
  start: number
  end: number
}

const UNIT_SECONDS: Record<string, number> = {
  second: 1, sec: 1, secs: 1, seconds: 1,
  minute: 60, min: 60, mins: 60, minutes: 60,
  hour: 3600, hr: 3600, hrs: 3600, hours: 3600,
}

const PATTERN = /(\d+(?:\.\d+)?)(?:\s*(?:to|-|–|or)\s*(\d+(?:\.\d+)?))?\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/gi

/** Finds cooking durations in an instruction ("bake for 25 minutes"). */
export function findDurations(text: string): Duration[] {
  const out: Duration[] = []
  for (const m of text.matchAll(PATTERN)) {
    const hi = parseFloat(m[2] ?? m[1])
    const unit = UNIT_SECONDS[m[3].toLowerCase()] ?? 60
    const seconds = Math.round(hi * unit)
    if (seconds <= 0 || seconds > 48 * 3600) continue
    out.push({ label: m[0], seconds, start: m.index!, end: m.index! + m[0].length })
  }
  return out
}

/** 75 → "1:15", 3725 → "1:02:05" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}
