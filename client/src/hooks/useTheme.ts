import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type ThemeChoice = 'system' | 'light' | 'dark'
const KEY = 'tt:theme'

// One shared store so every toggle in the app stays in step.
const listeners = new Set<() => void>()
let choice: ThemeChoice = read()

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function systemDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function apply(next: ThemeChoice) {
  choice = next
  const root = document.documentElement
  if (next === 'system') delete root.dataset.theme
  else root.dataset.theme = next
  try {
    if (next === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, next)
  } catch { /* ignore */ }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  mq?.addEventListener('change', l)
  return () => {
    listeners.delete(l)
    mq?.removeEventListener('change', l)
  }
}

const snapshot = () => `${choice}:${systemDark() ? 'dark' : 'light'}`

/** Light / dark / follow-the-system, saved per browser. */
export function useTheme() {
  const snap = useSyncExternalStore(subscribe, snapshot)
  const [current, sys] = snap.split(':') as [ThemeChoice, 'dark' | 'light']
  const isDark = current === 'system' ? sys === 'dark' : current === 'dark'

  useEffect(() => {
    const meta = document.querySelectorAll('meta[name="theme-color"]')
    meta.forEach((m) => m.setAttribute('content', isDark ? '#161311' : '#F6F1E9'))
  }, [isDark])

  const setChoice = useCallback((c: ThemeChoice) => apply(c), [])
  const toggle = useCallback(() => apply(isDark ? 'light' : 'dark'), [isDark])

  return { choice: current, setChoice, isDark, toggle }
}
