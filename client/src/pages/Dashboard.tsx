import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { useFilters } from '../hooks/useFilters'
import { applyFilters } from '../utils/helpers'
import { FilterBar } from '../components/filters/FilterBar'
import { RecipeGrid } from '../components/recipes/RecipeGrid'
import { Button } from '../components/ui/Button'
import styles from './Dashboard.module.css'
import { useEffect } from 'react'

export function Dashboard() {
  const { recipes } = useRecipeContext()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const filters = useFilters()

  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat) filters.setCategory(cat)
  }, [searchParams.get('category')])

  const filtered = applyFilters(recipes, filters.filters)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Recipe Box</h1>
          <p className={styles.subtitle}>
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your kitchen
          </p>
        </div>
        <Button
          onClick={() => navigate('/add')}
          size="lg"
          icon={<span>+</span>}
        >
          Add Recipe
        </Button>
      </div>

      <FilterBar
        filters={filters}
        totalCount={recipes.length}
        filteredCount={filtered.length}
      />

      <div className={styles.content}>
        <RecipeGrid
          recipes={filtered}
          onAddRecipe={() => navigate('/add')}
        />
      </div>
    </div>
  )
}
