import { HeartIcon } from './Icons'
import styles from './StarButton.module.css'

interface StarButtonProps {
  isFavorite: boolean
  onToggle: (e: React.MouseEvent) => void
  size?: 'sm' | 'md' | 'lg'
  /** Frosted background for use on top of photos */
  floating?: boolean
}

/** Favorite toggle (a heart; the name is kept for existing imports). */
export function StarButton({ isFavorite, onToggle, size = 'md', floating }: StarButtonProps) {
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 18 : 22

  return (
    <button
      className={[styles.star, styles[size], floating ? styles.floating : '', isFavorite ? styles.active : ''].join(' ')}
      onClick={onToggle}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorite}
      type="button"
    >
      <HeartIcon
        size={iconSize}
        strokeWidth={isFavorite ? 0 : 1.75}
        className={isFavorite ? styles.filledIcon : styles.emptyIcon}
      />
    </button>
  )
}
