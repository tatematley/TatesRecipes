import { Link } from 'react-router-dom'
import styles from './Brand.module.css'

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className={`${styles.brand} ${compact ? styles.compact : ''}`} aria-label="Made by Tate home">
      <span className={styles.name}>
        Made by Tate
      </span>
    </Link>
  )
}
