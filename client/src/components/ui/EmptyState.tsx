import styles from './EmptyState.module.css'
import { Button } from './Button'
import { LeafIcon } from './Icons'

interface EmptyStateProps {
  title: string
  message: string
  /** A line icon, e.g. <SearchIcon size={26} /> */
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.mark} aria-hidden="true">{icon ?? <LeafIcon size={26} />}</div>
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
