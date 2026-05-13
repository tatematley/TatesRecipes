import { useState } from 'react'
import { FilterPanel } from './FilterPanel'
import styles from './FilterBar.module.css'
import { useFilters } from '../../hooks/useFilters'
import { Button } from '../ui/Button'

interface FilterBarProps {
  filters: ReturnType<typeof useFilters>
  totalCount: number
  filteredCount: number
}

export function FilterBar({ filters, totalCount, filteredCount }: FilterBarProps) {
  const [panelOpen, setPanelOpen] = useState(false)

  return (
    <>
      <div className={styles.bar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            value={filters.filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            placeholder="Search recipes, ingredients, tags…"
            className={styles.searchInput}
          />
          {filters.filters.search && (
            <button
              className={styles.clearSearch}
              onClick={() => filters.setSearch('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.quickFilters}>
          <button
            className={[
              styles.quickChip,
              filters.filters.favoritesOnly ? styles.active : '',
            ].join(' ')}
            onClick={() => filters.setFavoritesOnly(!filters.filters.favoritesOnly)}
          >
            ★ Favorites
          </button>
          <button
            className={[
              styles.quickChip,
              filters.filters.createdByTateOnly ? styles.active : '',
            ].join(' ')}
            onClick={() => filters.setCreatedByTateOnly(!filters.filters.createdByTateOnly)}
          >
            👨‍🍳 Tate's
          </button>
          <button
            className={[
              styles.quickChip,
              filters.filters.timeFilter === 'under30' ? styles.active : '',
            ].join(' ')}
            onClick={() =>
              filters.setTimeFilter(
                filters.filters.timeFilter === 'under30' ? '' : 'under30'
              )
            }
          >
            ⚡ Under 30 min
          </button>
        </div>

        <div className={styles.right}>
          <span className={styles.count}>
            {filteredCount === totalCount
              ? `${totalCount} recipes`
              : `${filteredCount} of ${totalCount}`}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPanelOpen(true)}
            icon={<span>⚙</span>}
          >
            Filters
            {filters.activeCount > 0 && (
              <span className={styles.filterBadge}>{filters.activeCount}</span>
            )}
          </Button>
          {filters.activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={filters.clearFilters}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      <FilterPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        filters={filters}
      />
    </>
  )
}
