import { findDurations } from '../../utils/timers'
import { useTimers } from '../../lib/timers'
import { TimerIcon } from '../ui/Icons'
import styles from './StepText.module.css'

interface Props {
  text: string
  stepNumber: number
  recipeTitle: string
}

/** Instruction text where every duration ("bake 25 minutes") is a tap-to-start timer. */
export function StepText({ text, stepNumber, recipeTitle }: Props) {
  const { start } = useTimers()
  const durations = findDurations(text)
  if (!durations.length) return <>{text}</>

  const parts: React.ReactNode[] = []
  let last = 0
  durations.forEach((d, i) => {
    parts.push(text.slice(last, d.start))
    parts.push(
      <button
        key={i}
        className={styles.timer}
        onClick={(e) => { e.stopPropagation(); start(d.seconds, `Step ${stepNumber} · ${d.label}`, recipeTitle) }}
        title="Start a timer"
      >
        <TimerIcon size={13} strokeWidth={2} />
        {d.label}
      </button>,
    )
    last = d.end
  })
  parts.push(text.slice(last))
  return <>{parts}</>
}
