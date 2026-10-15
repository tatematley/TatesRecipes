import { Link } from 'react-router-dom'
import { Recipe } from '../../types'
import { StarButton } from '../ui/StarButton'
import { RecipeCover } from '../ui/RecipeCover'
import { formatTime } from '../../utils/helpers'
import { useRecipeContext } from '../../context/RecipeContext'
import { useAppData } from '../../lib/appData'
import { ClockIcon, ChefHatIcon } from '../ui/Icons'
import styles from './RecipeCard.module.css'

interface RecipeCardProps {
  recipe: Recipe
  /** "grid" is the photo card; "row" is a compact list row */
  layout?: 'grid' | 'row'
  /** Extra line under the title, e.g. pantry match info */
  footer?: React.ReactNode
  index?: number
}

export function RecipeCard({ recipe, layout = 'grid', footer, index = 0 }: RecipeCardProps) {
  const { toggleFavorite } = useRecipeContext()
  const { cookLog } = useAppData()
  const timesMade = cookLog.filter((c) => c.recipeId === recipe.id).length

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(recipe.id)
  }

  const meta = [
    recipe.totalTime ? formatTime(recipe.totalTime) : null,
    recipe.servings ? `Serves ${recipe.servings}` : null,
  ].filter(Boolean)

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className={`${styles.card} ${styles[layout]}`}
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      <div className={styles.imageWrap}>
        <RecipeCover recipe={recipe} size={layout === 'row' ? 'sm' : 'md'} className={styles.image} />
        {layout === 'grid' && (
          <>
            <div className={styles.starWrap}>
              <StarButton isFavorite={recipe.isFavorite} onToggle={handleFavorite} size="sm" floating />
            </div>
            {recipe.createdByTate && (
              <span className={styles.tateBadge}><ChefHatIcon size={12} strokeWidth={2} /> Tate's</span>
            )}
          </>
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.category}>
          {recipe.category}
          {timesMade > 0 && <span className={styles.made}> · made {timesMade}×</span>}
        </p>
        <h3 className={styles.title}>{recipe.title}</h3>
        {layout === 'row' && recipe.description && <p className={styles.desc}>{recipe.description}</p>}
        {meta.length > 0 && (
          <p className={styles.meta}>
            <ClockIcon size={13} strokeWidth={1.75} />
            {meta.join(' · ')}
          </p>
        )}
        {footer}
      </div>

      {layout === 'row' && (
        <div className={styles.rowStar}>
          <StarButton isFavorite={recipe.isFavorite} onToggle={handleFavorite} size="sm" />
        </div>
      )}
    </Link>
  )
}
