import styles from './EmptyState.module.css'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.mark} aria-hidden="true" />
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="secondary">
          {action.label}
        </Button>
      )}
    </div>
  )
}
