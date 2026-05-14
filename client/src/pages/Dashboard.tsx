import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useRecipeContext } from '../context/RecipeContext'
import { useFilters } from '../hooks/useFilters'
import { applyFilters } from '../utils/helpers'
import { FilterBar } from '../components/filters/FilterBar'
import { RecipeGrid } from '../components/recipes/RecipeGrid'
import { Button } from '../components/ui/Button'
import { PlusIcon } from '../components/ui/Icons'
import styles from './Dashboard.module.css'

export function Dashboard() {
  const { recipes, loading, error } = useRecipeContext()
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
            {loading ? 'Loading…' : `${recipes.length} saved recipes`}
          </p>
        </div>
        <Button
          onClick={() => navigate('/add')}
          icon={<PlusIcon size={14} strokeWidth={2} />}
          disabled={loading}
        >
          Add Recipe
        </Button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <strong>Connection error:</strong> {error} — check your Supabase credentials in .env.local
        </div>
      )}

      <FilterBar
        filters={filters}
        totalCount={recipes.length}
        filteredCount={filtered.length}
      />

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : (
          <RecipeGrid recipes={filtered} onAddRecipe={() => navigate('/add')} />
        )}
      </div>
    </div>
  )
}
