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
        <span className={styles.icon}>💡</span>
        <h3 className={styles.title}>Tate's Tips</h3>
      </div>
      {editable ? (
        <textarea
          value={tips}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Add your personal notes, alterations, or reminders... e.g. 'Use less sugar next time' or 'Mom loved this one!'"
          className={styles.textarea}
          rows={4}
        />
      ) : (
        <p className={styles.tips}>{tips}</p>
      )}
    </div>
  )
}
