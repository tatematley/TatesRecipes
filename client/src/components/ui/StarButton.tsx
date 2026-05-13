import { StarIcon } from './Icons'
import styles from './StarButton.module.css'

interface StarButtonProps {
  isFavorite: boolean
  onToggle: (e: React.MouseEvent) => void
  size?: 'sm' | 'md' | 'lg'
}

export function StarButton({ isFavorite, onToggle, size = 'md' }: StarButtonProps) {
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20

  return (
    <button
      className={[styles.star, styles[size], isFavorite ? styles.active : ''].join(' ')}
      onClick={onToggle}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      type="button"
    >
      <StarIcon
        size={iconSize}
        strokeWidth={isFavorite ? 0 : 1.5}
        className={isFavorite ? styles.filledIcon : styles.emptyIcon}
      />
    </button>
  )
}
