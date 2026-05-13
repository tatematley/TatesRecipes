import { useState } from 'react'
import { FilterPanel } from './FilterPanel'
import styles from './FilterBar.module.css'
import { useFilters } from '../../hooks/useFilters'
import { Button } from '../ui/Button'
import { SearchIcon, SlidersIcon, XIcon } from '../ui/Icons'

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
        <div className={styles.left}>
          <div className={styles.searchWrap}>
            <SearchIcon size={14} strokeWidth={1.75} className={styles.searchIcon} />
            <input
              type="text"
              value={filters.filters.search}
              onChange={(e) => filters.setSearch(e.target.value)}
              placeholder="Search recipes, ingredients, tags…"
              className={styles.searchInput}
            />
            {filters.filters.search && (
              <button className={styles.clearBtn} onClick={() => filters.setSearch('')} aria-label="Clear">
                <XIcon size={11} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className={styles.chips}>
            <button
              className={[styles.chip, filters.filters.favoritesOnly ? styles.chipActive : ''].join(' ')}
              onClick={() => filters.setFavoritesOnly(!filters.filters.favoritesOnly)}
            >
              Favorites
            </button>
            <button
              className={[styles.chip, filters.filters.createdByTateOnly ? styles.chipActive : ''].join(' ')}
              onClick={() => filters.setCreatedByTateOnly(!filters.filters.createdByTateOnly)}
            >
              Tate's
            </button>
            <button
              className={[styles.chip, filters.filters.timeFilter === 'under30' ? styles.chipActive : ''].join(' ')}
              onClick={() => filters.setTimeFilter(filters.filters.timeFilter === 'under30' ? '' : 'under30')}
            >
              Under 30 min
            </button>
          </div>
        </div>

        <div className={styles.right}>
          <span className={styles.count}>
            {filteredCount === totalCount ? `${totalCount} recipes` : `${filteredCount} of ${totalCount}`}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPanelOpen(true)}
            icon={<SlidersIcon size={13} strokeWidth={1.75} />}
          >
            Filters
            {filters.activeCount > 0 && <span className={styles.badge}>{filters.activeCount}</span>}
          </Button>
          {filters.activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={filters.clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <FilterPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} filters={filters} />
    </>
  )
}
