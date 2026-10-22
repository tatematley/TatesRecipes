import { Link } from 'react-router-dom'
import { Recipe } from '../../types'
import { RecipeCover } from '../ui/RecipeCover'
import styles from './RecipeTile.module.css'

/** Just the square picture; the name shows on hover and a small T marks Tate's originals. */
export function RecipeTile({ recipe, index = 0, tLeft }: { recipe: Recipe; index?: number; tLeft?: boolean }) {
  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className={styles.tile}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      aria-label={recipe.title}
    >
      <RecipeCover recipe={recipe} className={styles.image} />
      {recipe.createdByTate && <span className={`${styles.t} ${tLeft ? styles.tLeft : ''}`} aria-label="Tate's original">T</span>}
      {recipe.heroImage && <span className={styles.name} aria-hidden="true">{recipe.title}</span>}
    </Link>
  )
}
