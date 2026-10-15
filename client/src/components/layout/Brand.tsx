import { Link } from 'react-router-dom'
import styles from './Brand.module.css'

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className={`${styles.brand} ${compact ? styles.compact : ''}`} aria-label="Made by Tate home">
      <svg className={styles.mark} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="18" fill="currentColor" />
        <path d="M32 52V16" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" />
        <g fill="var(--bg)">
          <ellipse cx="25" cy="22" rx="6" ry="3.2" transform="rotate(-35 25 22)" />
          <ellipse cx="39" cy="26" rx="6" ry="3.2" transform="rotate(35 39 26)" />
          <ellipse cx="25" cy="32" rx="6" ry="3.2" transform="rotate(-35 25 32)" />
          <ellipse cx="39" cy="36" rx="6" ry="3.2" transform="rotate(35 39 36)" />
          <ellipse cx="25" cy="42" rx="6" ry="3.2" transform="rotate(-35 25 42)" />
        </g>
      </svg>
      <span className={styles.name}>
        Made by Tate
      </span>
    </Link>
  )
}
