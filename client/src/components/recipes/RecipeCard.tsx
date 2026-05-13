import { useNavigate } from 'react-router-dom'
import { Recipe } from '../../types'
import { StarButton } from '../ui/StarButton'
import { Tag } from '../ui/Tag'
import { formatTime } from '../../utils/helpers'
import { useRecipeContext } from '../../context/RecipeContext'
import styles from './RecipeCard.module.css'

interface RecipeCardProps {
  recipe: Recipe
}

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'

export function RecipeCard({ recipe }: RecipeCardProps) {
  const { toggleFavorite } = useRecipeContext()
  const navigate = useNavigate()

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    toggleFavorite(recipe.id)
  }

  const visibleTags = recipe.tags.slice(0, 3)
  const hasMoreTags = recipe.tags.length > 3

  return (
    <article
      className={styles.card}
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/recipe/${recipe.id}`)}
      aria-label={recipe.title}
    >
      <div className={styles.imageWrap}>
        <img
          src={recipe.heroImage || PLACEHOLDER}
          alt={recipe.title}
          className={styles.image}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER
          }}
        />
        <div className={styles.imageOverlay} />
        <StarButton
          isFavorite={recipe.isFavorite}
          onToggle={handleFavorite}
          size="sm"
        />
        <div className={styles.category}>{recipe.category}</div>
        {recipe.createdByTate && (
          <div className={styles.tatesBadge}>👨‍🍳 Tate's</div>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{recipe.title}</h3>

        {recipe.description && (
          <p className={styles.description}>{recipe.description}</p>
        )}

        <div className={styles.meta}>
          {recipe.prepTime != null && (
            <span className={styles.metaItem} title="Prep time">
              <span className={styles.metaIcon}>⏱</span>
              <span className={styles.metaLabel}>Prep</span>
              {formatTime(recipe.prepTime)}
            </span>
          )}
          {recipe.cookTime != null && (
            <span className={styles.metaItem} title="Cook time">
              <span className={styles.metaIcon}>🔥</span>
              <span className={styles.metaLabel}>Cook</span>
              {formatTime(recipe.cookTime)}
            </span>
          )}
          {recipe.totalTime != null && (
            <span className={[styles.metaItem, styles.metaTotal].join(' ')} title="Total time">
              <span className={styles.metaIcon}>⏰</span>
              {formatTime(recipe.totalTime)}
            </span>
          )}
          {recipe.servings != null && (
            <span className={styles.metaItem} title="Servings">
              <span className={styles.metaIcon}>🍽</span>
              {recipe.servings}
            </span>
          )}
        </div>

        {visibleTags.length > 0 && (
          <div className={styles.tags}>
            {visibleTags.map((tag) => (
              <Tag key={tag} label={tag} size="sm" />
            ))}
            {hasMoreTags && (
              <span className={styles.moreTags}>+{recipe.tags.length - 3}</span>
            )}
          </div>
        )}

        {recipe.tatesTips && (
          <p className={styles.tipPreview}>
            <span className={styles.tipIcon}>💡</span>
            {recipe.tatesTips.length > 80
              ? recipe.tatesTips.slice(0, 80) + '…'
              : recipe.tatesTips}
          </p>
        )}
      </div>
    </article>
  )
}
