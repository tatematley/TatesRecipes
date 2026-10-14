import { Recipe } from '../../types'
import { RecipeCard } from './RecipeCard'
import { EmptyState } from '../ui/EmptyState'
import styles from './RecipeGrid.module.css'

interface RecipeGridProps {
  recipes: Recipe[]
  layout?: 'grid' | 'row'
  onAddRecipe?: () => void
  emptyTitle?: string
  emptyMessage?: string
}

export function RecipeGrid({ recipes, layout = 'grid', onAddRecipe, emptyTitle, emptyMessage }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? 'No recipes found'}
        message={emptyMessage ?? 'Try a different search or filter, or add a new recipe.'}
        emoji="🔍"
        action={onAddRecipe ? { label: 'Add a recipe', onClick: onAddRecipe } : undefined}
      />
    )
  }

  return (
    <div className={layout === 'grid' ? styles.grid : styles.list}>
      {recipes.map((recipe, i) => (
        <RecipeCard key={recipe.id} recipe={recipe} layout={layout} index={i} />
      ))}
    </div>
  )
}
