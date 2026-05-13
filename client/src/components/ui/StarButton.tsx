import styles from './StarButton.module.css'

interface StarButtonProps {
  isFavorite: boolean
  onToggle: (e: React.MouseEvent) => void
  size?: 'sm' | 'md' | 'lg'
}

export function StarButton({ isFavorite, onToggle, size = 'md' }: StarButtonProps) {
  return (
    <button
      className={[styles.star, styles[size], isFavorite ? styles.active : ''].join(' ')}
      onClick={onToggle}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      type="button"
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorite ? '★' : '☆'}
    </button>
  )
}
