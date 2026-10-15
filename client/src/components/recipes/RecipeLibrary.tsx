import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Recipe } from '../../types'
import { useFilters } from '../../hooks/useFilters'
import { applyFilters, sortRecipes } from '../../utils/helpers'
import { searchRecipes } from '../../utils/search'
import { useAppData } from '../../lib/appData'
import { RecipeGrid } from './RecipeGrid'
import { FilterPanel } from '../filters/FilterPanel'
import { SlidersIcon } from '../ui/Icons'
import styles from './RecipeLibrary.module.css'

interface Props {
  recipes: Recipe[]
  loading?: boolean
  /** Shown beside the Filters button (e.g. the home page's view toggles). */
  chips?: React.ReactNode
  emptyTitle?: string
  emptyMessage?: string
}

/** The recipe grid with one Filters button. The search comes from the top bar, via the URL. */
export function RecipeLibrary({ recipes, loading, chips, emptyTitle, emptyMessage }: Props) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filters = useFilters()
  const { cookLog } = useAppData()
  const [panelOpen, setPanelOpen] = useState(false)

  const query = params.get('q') ?? ''

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  // A ?category= link (from the command palette, say) seeds the filter once
  useEffect(() => {
    const c = params.get('category')
    if (c) filters.setCategory(c)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cookCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const e of cookLog) c[e.recipeId] = (c[e.recipeId] ?? 0) + 1
    return c
  }, [cookLog])

  const results = useMemo(() => {
    const searched = query ? searchRecipes(recipes, query) : sortRecipes(recipes, 'newest', cookCounts)
    return applyFilters(searched, filters.filters)
  }, [recipes, query, cookCounts, filters.filters])

  const filterCount = filters.activeCount - (filters.filters.search ? 1 : 0)
  const narrowing = !!query || filters.activeCount > 0

  return (
    <section className={styles.library}>
      <div className={styles.toolbar}>
        {chips}
        <button className={`${styles.filterBtn} ${filterCount > 0 ? styles.filterOn : ''}`} onClick={() => setPanelOpen(true)}>
          <SlidersIcon size={15} strokeWidth={1.75} />
          <span>Filters</span>
          {filterCount > 0 && <span className={styles.badge}>{filterCount}</span>}
        </button>
      </div>

      {narrowing && !loading && (
        <div className={styles.count}>
          {`${results.length} ${results.length === 1 ? 'recipe' : 'recipes'}${query ? ` for “${query}”` : ''}`}
          <button className={styles.reset} onClick={() => { filters.clearFilters(); setParam('q', '') }}>
            Clear all
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.skeletons}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '1 / 1' }} />
          ))}
        </div>
      ) : (
        <RecipeGrid
          recipes={results}
          onAddRecipe={() => navigate('/add')}
          emptyTitle={recipes.length === 0 ? emptyTitle : undefined}
          emptyMessage={recipes.length === 0 ? emptyMessage : undefined}
        />
      )}

      <FilterPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        filters={filters}
      />
    </section>
  )
}
