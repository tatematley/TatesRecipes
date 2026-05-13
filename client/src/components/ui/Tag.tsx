import styles from './Tag.module.css'

interface TagProps {
  label: string
  onRemove?: () => void
  size?: 'sm' | 'md'
  variant?: 'default' | 'green' | 'outlined'
}

export function Tag({ label, onRemove, size = 'md', variant = 'default' }: TagProps) {
  return (
    <span className={[styles.tag, styles[size], styles[variant]].join(' ')}>
      {label}
      {onRemove && (
        <button
          className={styles.remove}
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          type="button"
        >
          ×
        </button>
      )}
    </span>
  )
}
