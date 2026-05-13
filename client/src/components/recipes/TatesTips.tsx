import styles from './TatesTips.module.css'

interface TatesTipsProps {
  tips: string
  editable?: boolean
  onChange?: (value: string) => void
}

export function TatesTips({ tips, editable, onChange }: TatesTipsProps) {
  if (!editable && !tips) return null

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>Tate's Tips</span>
      </div>
      {editable ? (
        <textarea
          value={tips}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Add personal notes, alterations, or reminders — e.g. 'Use less sugar next time' or 'Mom loved this one.'"
          className={styles.textarea}
          rows={4}
        />
      ) : (
        <p className={styles.tips}>{tips}</p>
      )}
    </div>
  )
}
