import { Link } from 'react-router-dom'
import { Recipe } from '../../types'
import { RecipeCover } from '../ui/RecipeCover'
import styles from './RecipeTile.module.css'

/** Just the square picture; a small T marks Tate's originals. */
export function RecipeTile({ recipe, index = 0 }: { recipe: Recipe; index?: number }) {
  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className={styles.tile}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      aria-label={recipe.title}
      title={recipe.title}
    >
      <RecipeCover recipe={recipe} className={styles.image} />
      {recipe.createdByTate && <span className={styles.t} aria-label="Tate's original">T</span>}
    </Link>
  )
}
