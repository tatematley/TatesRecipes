import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type ThemeChoice = 'light' | 'dark'
const KEY = 'tt:theme'

// One shared store so every toggle in the app stays in step.
const listeners = new Set<() => void>()
let choice: ThemeChoice = read()

function read(): ThemeChoice {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function apply(next: ThemeChoice) {
  choice = next
  const root = document.documentElement
  if (next === 'dark') root.dataset.theme = 'dark'
  else delete root.dataset.theme
  try {
    if (next === 'dark') localStorage.setItem(KEY, 'dark')
    else localStorage.removeItem(KEY)
  } catch { /* ignore */ }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

const snapshot = () => choice

/** Light by default; dark only when picked, saved per browser. */
export function useTheme() {
  const current = useSyncExternalStore(subscribe, snapshot)
  const isDark = current === 'dark'

  useEffect(() => {
    const meta = document.querySelectorAll('meta[name="theme-color"]')
    meta.forEach((m) => m.setAttribute('content', isDark ? '#0F1A2E' : '#1B2E4F'))
  }, [isDark])

  const setChoice = useCallback((c: ThemeChoice) => apply(c), [])
  const toggle = useCallback(() => apply(isDark ? 'light' : 'dark'), [isDark])

  return { choice: current, setChoice, isDark, toggle }
}
