import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatClock } from '../utils/timers'
import { PauseIcon, PlayIcon, XIcon, TimerIcon } from '../components/ui/Icons'
import styles from './timers.module.css'

export interface KitchenTimer {
  id: string
  label: string
  recipeTitle?: string
  duration: number          // seconds
  endsAt: number | null     // ms epoch while running
  remaining: number         // seconds, used while paused
  done: boolean
}

interface TimerCtx {
  timers: KitchenTimer[]
  start: (seconds: number, label: string, recipeTitle?: string) => void
  toggle: (id: string) => void
  dismiss: (id: string) => void
  /** Hide the floating dock (cook mode shows timers itself) */
  setDockHidden: (hidden: boolean) => void
}

const Ctx = createContext<TimerCtx | null>(null)
const KEY = 'tt:timers'

function remainingOf(t: KitchenTimer, now: number) {
  return t.endsAt ? Math.max(0, (t.endsAt - now) / 1000) : t.remaining
}

function chime() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const notes = [880, 1174.66, 1567.98]
    notes.forEach((f, i) => {
      for (const rep of [0, 1.1]) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.value = f
        const t0 = ctx.currentTime + rep + i * 0.16
        g.gain.setValueAtTime(0.0001, t0)
        g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6)
        o.connect(g).connect(ctx.destination)
        o.start(t0)
        o.stop(t0 + 0.65)
      }
    })
  } catch { /* audio not available */ }
  navigator.vibrate?.([200, 100, 200, 100, 400])
}

/** Kitchen timers that keep running while you move around the app. */
export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timers, setTimers] = useState<KitchenTimer[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]') } catch { return [] }
  })
  const [now, setNow] = useState(Date.now())
  const [dockHidden, setDockHidden] = useState(false)
  const notified = useRef(new Set<string>())

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(timers)) } catch { /* ignore */ }
  }, [timers])

  const running = timers.some((t) => t.endsAt && !t.done)
  useEffect(() => {
    if (!running) return
    const iv = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(iv)
  }, [running])

  // Fire completion once per timer
  useEffect(() => {
    const finished = timers.filter((t) => t.endsAt && !t.done && t.endsAt <= now)
    if (!finished.length) return
    setTimers((ts) => ts.map((t) => (finished.some((f) => f.id === t.id) ? { ...t, done: true, endsAt: null, remaining: 0 } : t)))
    for (const t of finished) {
      if (notified.current.has(t.id)) continue
      notified.current.add(t.id)
      chime()
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        new Notification(`${t.label} is done`, { body: t.recipeTitle ?? 'Tate & Thyme timer' })
      }
    }
  }, [now, timers])

  const start = useCallback((seconds: number, label: string, recipeTitle?: string) => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {})
    setNow(Date.now())
    setTimers((ts) => [...ts, {
      id: crypto.randomUUID(), label, recipeTitle, duration: seconds, endsAt: Date.now() + seconds * 1000, remaining: seconds, done: false,
    }])
  }, [])

  const toggle = useCallback((id: string) => {
    setTimers((ts) => ts.map((t) => {
      if (t.id !== id || t.done) return t
      if (t.endsAt) return { ...t, endsAt: null, remaining: remainingOf(t, Date.now()) }
      return { ...t, endsAt: Date.now() + t.remaining * 1000 }
    }))
  }, [])

  const dismiss = useCallback((id: string) => setTimers((ts) => ts.filter((t) => t.id !== id)), [])

  const value: TimerCtx = { timers: timers.map((t) => ({ ...t, remaining: remainingOf(t, now) })), start, toggle, dismiss, setDockHidden }

  return (
    <Ctx.Provider value={value}>
      {children}
      {!dockHidden && value.timers.length > 0 && createPortal(
        <div className={styles.dock}>
          {value.timers.map((t) => <TimerPill key={t.id} timer={t} onToggle={() => toggle(t.id)} onDismiss={() => dismiss(t.id)} />)}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  )
}

export function TimerPill({ timer, onToggle, onDismiss, large }: { timer: KitchenTimer; onToggle: () => void; onDismiss: () => void; large?: boolean }) {
  const pct = timer.duration ? 1 - timer.remaining / timer.duration : 1
  const r = large ? 22 : 16
  const c = 2 * Math.PI * r
  return (
    <div className={`${styles.pill} ${timer.done ? styles.done : ''} ${large ? styles.large : ''}`}>
      <svg className={styles.ring} viewBox={`0 0 ${r * 2 + 6} ${r * 2 + 6}`} width={r * 2 + 6} height={r * 2 + 6} aria-hidden="true">
        <circle cx={r + 3} cy={r + 3} r={r} className={styles.track} />
        <circle cx={r + 3} cy={r + 3} r={r} className={styles.progress} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <span className={styles.ringIcon}><TimerIcon size={large ? 16 : 13} strokeWidth={2} /></span>
      <div className={styles.text}>
        <span className={styles.clock}>{timer.done ? 'Done!' : formatClock(timer.remaining)}</span>
        <span className={styles.label}>{timer.label}</span>
      </div>
      {!timer.done && (
        <button className={styles.btn} onClick={onToggle} aria-label={timer.endsAt ? 'Pause timer' : 'Resume timer'}>
          {timer.endsAt ? <PauseIcon size={14} strokeWidth={2} /> : <PlayIcon size={14} strokeWidth={2} />}
        </button>
      )}
      <button className={styles.btn} onClick={onDismiss} aria-label="Dismiss timer"><XIcon size={14} strokeWidth={2} /></button>
    </div>
  )
}

export function useTimers(): TimerCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTimers must be used within TimerProvider')
  return ctx
}
