import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Recipe, ALL_CATEGORIES } from '../../types'
import { useFilters } from '../../hooks/useFilters'
import { applyFilters, sortRecipes, SortKey } from '../../utils/helpers'
import { searchRecipes } from '../../utils/search'
import { useAppData } from '../../lib/appData'
import { RecipeGrid } from './RecipeGrid'
import { FilterPanel } from '../filters/FilterPanel'
import { CategoryIcon, UtensilsIcon } from '../ui/FoodIcons'
import { GridIcon, HeartIcon, ListIcon, SearchIcon, SlidersIcon, XIcon } from '../ui/Icons'
import styles from './RecipeLibrary.module.css'

interface Props {
  recipes: Recipe[]
  loading?: boolean
  /** Show the category chip rail */
  showCategories?: boolean
  emptyTitle?: string
  emptyMessage?: string
}

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'az', label: 'A–Z' },
  { value: 'quickest', label: 'Quickest' },
  { value: 'cooked', label: 'Most made' },
]

/** Search, filter, sort and browse. Search, category and sort live in the URL. */
export function RecipeLibrary({ recipes, loading, showCategories = true, emptyTitle, emptyMessage }: Props) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filters = useFilters()
  const { cookLog } = useAppData()
  const [panelOpen, setPanelOpen] = useState(false)
  const [layout, setLayout] = useState<'grid' | 'row'>(() => {
    try { return localStorage.getItem('tt:layout') === 'row' ? 'row' : 'grid' } catch { return 'grid' }
  })

  const query = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const sort = (params.get('sort') as SortKey) || 'newest'

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  useEffect(() => { try { localStorage.setItem('tt:layout', layout) } catch { /* ignore */ } }, [layout])

  // Category lives in the URL; mirror it into the filter state the panel edits
  useEffect(() => { filters.setCategory(category) }, [category]) // eslint-disable-line react-hooks/exhaustive-deps

  const cookCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const e of cookLog) c[e.recipeId] = (c[e.recipeId] ?? 0) + 1
    return c
  }, [cookLog])

  const results = useMemo(() => {
    const searched = query ? searchRecipes(recipes, query) : sortRecipes(recipes, sort, cookCounts)
    return applyFilters(searched, { ...filters.filters, category })
  }, [recipes, query, sort, cookCounts, filters.filters, category])

  const presentCategories = useMemo(
    () => ALL_CATEGORIES.filter((c) => recipes.some((r) => r.category === c)),
    [recipes],
  )

  const panelCount = filters.activeCount - (filters.filters.category ? 1 : 0) - (filters.filters.search ? 1 : 0)
  const f = filters.filters

  return (
    <section className={styles.library}>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <SearchIcon size={17} strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Search by name, ingredient, or tag"
            aria-label="Search recipes"
          />
          {query && (
            <button onClick={() => setParam('q', '')} aria-label="Clear search" className={styles.clear}>
              <XIcon size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className={styles.controls}>
          <button className={`${styles.chip} ${f.favoritesOnly ? styles.chipOn : ''}`} onClick={() => filters.setFavoritesOnly(!f.favoritesOnly)}>
            <HeartIcon size={14} strokeWidth={1.75} /> Favorites
          </button>
          <button className={`${styles.chip} ${f.timeFilter === 'under30' ? styles.chipOn : ''}`} onClick={() => filters.setTimeFilter(f.timeFilter === 'under30' ? '' : 'under30')}>
            Under 30 min
          </button>
          <button className={`${styles.chip} ${panelCount > 0 ? styles.chipOn : ''}`} onClick={() => setPanelOpen(true)}>
            <SlidersIcon size={14} strokeWidth={1.75} /> Filters{panelCount > 0 ? ` · ${panelCount}` : ''}
          </button>
          <div className={styles.spacer} />
          <select className={styles.sort} value={sort} onChange={(e) => setParam('sort', e.target.value === 'newest' ? '' : e.target.value)} aria-label="Sort" disabled={!!query}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{query ? 'Best match' : s.label}</option>)}
          </select>
          <div className={styles.segment} role="group" aria-label="Layout">
            <button className={layout === 'grid' ? styles.segOn : ''} onClick={() => setLayout('grid')} aria-label="Grid view"><GridIcon size={15} /></button>
            <button className={layout === 'row' ? styles.segOn : ''} onClick={() => setLayout('row')} aria-label="List view"><ListIcon size={15} /></button>
          </div>
        </div>
      </div>

      {showCategories && presentCategories.length > 1 && (
        <div className={styles.rail} role="tablist" aria-label="Categories">
          <button className={`${styles.cat} ${!category ? styles.catOn : ''}`} onClick={() => setParam('category', '')}>
            <UtensilsIcon size={15} /> All
          </button>
          {presentCategories.map((c) => (
            <button key={c} className={`${styles.cat} ${category === c ? styles.catOn : ''}`} onClick={() => setParam('category', category === c ? '' : c)}>
              <CategoryIcon category={c} size={15} /> {c}
            </button>
          ))}
        </div>
      )}

      <div className={styles.count}>
        {loading ? 'Loading…' : `${results.length} ${results.length === 1 ? 'recipe' : 'recipes'}${query ? ` for “${query}”` : ''}`}
        {(filters.activeCount > 0 || query) && !loading && (
          <button className={styles.reset} onClick={() => { filters.clearFilters(); setParams(new URLSearchParams(), { replace: true }) }}>
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.skeletons}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}><div className="skeleton" style={{ aspectRatio: '4 / 3' }} /><div className="skeleton" style={{ height: 18, marginTop: 14, width: '70%' }} /></div>
          ))}
        </div>
      ) : (
        <RecipeGrid
          recipes={results}
          layout={layout}
          onAddRecipe={() => navigate('/add')}
          emptyTitle={recipes.length === 0 ? emptyTitle : undefined}
          emptyMessage={recipes.length === 0 ? emptyMessage : undefined}
        />
      )}

      <FilterPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} filters={filters} />
    </section>
  )
}
