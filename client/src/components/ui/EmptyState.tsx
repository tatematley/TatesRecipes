import styles from './EmptyState.module.css'
import { Button } from './Button'

interface EmptyStateProps {
  emoji: string
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ emoji, title, message, action }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.emoji}>{emoji}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
