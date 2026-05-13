import { useNavigate } from 'react-router-dom'
import { Recipe } from '../../types'
import { StarButton } from '../ui/StarButton'
import { Tag } from '../ui/Tag'
import { formatTime } from '../../utils/helpers'
import { useRecipeContext } from '../../context/RecipeContext'
import { ClockIcon } from '../ui/Icons'
import styles from './RecipeCard.module.css'

interface RecipeCardProps {
  recipe: Recipe
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'

export function RecipeCard({ recipe }: RecipeCardProps) {
  const { toggleFavorite } = useRecipeContext()
  const navigate = useNavigate()

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    toggleFavorite(recipe.id)
  }

  const visibleTags = recipe.tags.slice(0, 2)

  return (
    <article
      className={styles.card}
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/recipe/${recipe.id}`)}
    >
      <div className={styles.imageWrap}>
        <img
          src={recipe.heroImage || PLACEHOLDER}
          alt={recipe.title}
          className={styles.image}
          loading="lazy"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
        <div className={styles.starWrap}>
          <StarButton isFavorite={recipe.isFavorite} onToggle={handleFavorite} size="sm" />
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.category}>{recipe.category}</span>
          {recipe.createdByTate && (
            <span className={styles.tatePill}>Tate's</span>
          )}
        </div>

        <h3 className={styles.title}>{recipe.title}</h3>

        <div className={styles.timeRow}>
          {recipe.totalTime != null && (
            <span className={styles.timeItem}>
              <ClockIcon size={12} strokeWidth={1.75} />
              {formatTime(recipe.totalTime)}
            </span>
          )}
          {recipe.servings != null && (
            <span className={styles.timeItem}>Serves {recipe.servings}</span>
          )}
          {recipe.difficulty && (
            <span className={styles.timeItem} style={{ textTransform: 'capitalize' }}>
              {recipe.difficulty}
            </span>
          )}
        </div>

        {visibleTags.length > 0 && (
          <div className={styles.tags}>
            {visibleTags.map((tag) => (
              <Tag key={tag} label={tag} size="sm" />
            ))}
            {recipe.tags.length > 2 && (
              <span className={styles.moreTag}>+{recipe.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
