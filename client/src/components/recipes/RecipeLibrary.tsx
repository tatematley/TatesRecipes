import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Recipe } from '../../types'
import { useFilters } from '../../hooks/useFilters'
import { applyFilters, sortRecipes, SortKey } from '../../utils/helpers'
import { searchRecipes } from '../../utils/search'
import { useAppData } from '../../lib/appData'
import { RecipeGrid } from './RecipeGrid'
import { FilterPanel } from '../filters/FilterPanel'
import { SearchIcon, SlidersIcon, XIcon } from '../ui/Icons'
import styles from './RecipeLibrary.module.css'

interface Props {
  recipes: Recipe[]
  loading?: boolean
  /** Shown under the search bar while nothing is searched or filtered (e.g. the home page shelves). */
  browse?: React.ReactNode
  /** Heading over the grid while browsing */
  allTitle?: string
  emptyTitle?: string
  emptyMessage?: string
}

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'az', label: 'A–Z' },
  { value: 'quickest', label: 'Quickest' },
  { value: 'cooked', label: 'Most made' },
]

/** Search plus one Filters button. Search, category and sort live in the URL. */
export function RecipeLibrary({ recipes, loading, browse, allTitle, emptyTitle, emptyMessage }: Props) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filters = useFilters()
  const { cookLog } = useAppData()
  const [panelOpen, setPanelOpen] = useState(false)

  const query = params.get('q') ?? ''
  const sort = (params.get('sort') as SortKey) || 'newest'

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
    const searched = query ? searchRecipes(recipes, query) : sortRecipes(recipes, sort, cookCounts)
    return applyFilters(searched, filters.filters)
  }, [recipes, query, sort, cookCounts, filters.filters])

  const filterCount = filters.activeCount - (filters.filters.search ? 1 : 0) + (sort !== 'newest' ? 1 : 0)
  const narrowing = !!query || filters.activeCount > 0
  const browsing = !narrowing && !loading

  return (
    <section className={styles.library}>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <SearchIcon size={18} strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Search recipes, ingredients or tags"
            aria-label="Search recipes"
          />
          {query && (
            <button onClick={() => setParam('q', '')} aria-label="Clear search" className={styles.clear}>
              <XIcon size={14} strokeWidth={2} />
            </button>
          )}
        </div>
        <button className={`${styles.filterBtn} ${filterCount > 0 ? styles.filterOn : ''}`} onClick={() => setPanelOpen(true)}>
          <SlidersIcon size={16} strokeWidth={1.75} />
          <span>Filters</span>
          {filterCount > 0 && <span className={styles.badge}>{filterCount}</span>}
        </button>
      </div>

      {browsing && browse}

      {browsing && allTitle ? (
        <div className={styles.allHead}>
          <h2 className={styles.allTitle}>{allTitle}</h2>
          <span className={styles.allCount}>{results.length}</span>
        </div>
      ) : !loading && (
        <div className={styles.count}>
          {`${results.length} ${results.length === 1 ? 'recipe' : 'recipes'}${query ? ` for “${query}”` : ''}`}
          {narrowing && (
            <button className={styles.reset} onClick={() => { filters.clearFilters(); setParams(new URLSearchParams(), { replace: true }) }}>
              Clear all
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className={styles.skeletons}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}><div className="skeleton" style={{ aspectRatio: '4 / 3' }} /><div className="skeleton" style={{ height: 18, marginTop: 14, width: '70%' }} /></div>
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
        sort={{ value: sort, options: SORTS, disabled: !!query, onChange: (v) => setParam('sort', v === 'newest' ? '' : v) }}
      />
    </section>
  )
}
