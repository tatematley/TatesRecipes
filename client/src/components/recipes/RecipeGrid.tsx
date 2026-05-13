import { Recipe } from '../../types'
import { RecipeCard } from './RecipeCard'
import { EmptyState } from '../ui/EmptyState'
import styles from './RecipeGrid.module.css'

interface RecipeGridProps {
  recipes: Recipe[]
  onAddRecipe?: () => void
}

export function RecipeGrid({ recipes, onAddRecipe }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <EmptyState
        title="No recipes found"
        message="Try adjusting your filters, or add your first recipe to get started."
        action={onAddRecipe ? { label: 'Add a Recipe', onClick: onAddRecipe } : undefined}
      />
    )
  }

  return (
    <div className={styles.grid}>
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
