import styles from './SprigAvatar.module.css'

/** The assistant's little thyme-sprig avatar. Gently sways while it's writing. */
export function SprigAvatar({ size = 32, active = false }: { size?: number; active?: boolean }) {
  return (
    <span className={`${styles.avatar} ${active ? styles.active : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 32 32" width={size * 0.62} height={size * 0.62}>
        <path d="M16 28V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <g fill="currentColor">
          <ellipse cx="12.2" cy="9.5" rx="3.6" ry="1.9" transform="rotate(-35 12.2 9.5)" />
          <ellipse cx="19.8" cy="12.5" rx="3.6" ry="1.9" transform="rotate(35 19.8 12.5)" />
          <ellipse cx="12.2" cy="15.5" rx="3.6" ry="1.9" transform="rotate(-35 12.2 15.5)" />
          <ellipse cx="19.8" cy="18.5" rx="3.6" ry="1.9" transform="rotate(35 19.8 18.5)" />
          <ellipse cx="12.2" cy="21.5" rx="3.6" ry="1.9" transform="rotate(-35 12.2 21.5)" />
        </g>
      </svg>
    </span>
  )
}
