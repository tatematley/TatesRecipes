import styles from './Tag.module.css'
import { getTagColor } from '../../utils/helpers'

interface TagProps {
  label: string
  onRemove?: () => void
  size?: 'sm' | 'md'
}

export function Tag({ label, onRemove, size = 'md' }: TagProps) {
  const colorClass = styles[getTagColor(label)] ?? styles.default

  return (
    <span className={[styles.tag, colorClass, styles[size]].join(' ')}>
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
