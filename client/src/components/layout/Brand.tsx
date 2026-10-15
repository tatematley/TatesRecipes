import { Link } from 'react-router-dom'
import styles from './Brand.module.css'

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className={`${styles.brand} ${compact ? styles.compact : ''}`} aria-label="Made by Tate home">
      <img src="/logo.png" alt="Made by Tate" className={styles.logo} />
    </Link>
  )
}
