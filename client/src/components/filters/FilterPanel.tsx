import { useEffect } from 'react'
import styles from './FilterPanel.module.css'
import { useFilters } from '../../hooks/useFilters'
import { ALL_DIETARY_TAGS, ALL_OCCASION_TAGS, ALL_CATEGORIES } from '../../types'
import { Button } from '../ui/Button'

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  filters: ReturnType<typeof useFilters>
}

const TIME_OPTIONS = [
  { value: 'under15', label: 'Under 15 min' },
  { value: 'under30', label: 'Under 30 min' },
  { value: 'under60', label: 'Under 1 hour' },
  { value: 'over60',  label: 'Over 1 hour' },
]

const DIFFICULTIES = [
  { value: 'easy',     label: 'Easy' },
  { value: 'medium',   label: 'Medium' },
  { value: 'advanced', label: 'Advanced' },
]

export function FilterPanel({ isOpen, onClose, filters }: FilterPanelProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}
      <div className={[styles.panel, isOpen ? styles.open : ''].join(' ')}>
        <div className={styles.header}>
          <h3 className={styles.title}>Filter Recipes</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* Category */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Category</h4>
            <div className={styles.chipGrid}>
              <button
                className={[styles.chip, !filters.filters.category ? styles.chipActive : ''].join(' ')}
                onClick={() => filters.setCategory('')}
              >All</button>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={[styles.chip, filters.filters.category === cat ? styles.chipActive : ''].join(' ')}
                  onClick={() => filters.setCategory(filters.filters.category === cat ? '' : cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* Time */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Total Time</h4>
            <div className={styles.chipGroup}>
              {TIME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={[styles.chip, filters.filters.timeFilter === value ? styles.chipActive : ''].join(' ')}
                  onClick={() => filters.setTimeFilter(filters.filters.timeFilter === value ? '' : value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Difficulty */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Difficulty</h4>
            <div className={styles.chipGroup}>
              {DIFFICULTIES.map(({ value, label }) => (
                <button
                  key={value}
                  className={[styles.chip, filters.filters.difficulty === value ? styles.chipActive : ''].join(' ')}
                  onClick={() => filters.setDifficulty(filters.filters.difficulty === value ? '' : value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Dietary */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Dietary</h4>
            <div className={styles.chipGrid}>
              {ALL_DIETARY_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={[styles.chip, styles.dietaryChip, filters.filters.dietaryTags.includes(tag) ? styles.chipActive : ''].join(' ')}
                  onClick={() => filters.toggleDietaryTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* Occasion */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Occasion</h4>
            <div className={styles.chipGrid}>
              {ALL_OCCASION_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={[styles.chip, styles.occasionChip, filters.filters.occasionTags.includes(tag) ? styles.chipActive : ''].join(' ')}
                  onClick={() => filters.toggleOccasionTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* Toggles */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Show</h4>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={filters.filters.favoritesOnly}
                onChange={(e) => filters.setFavoritesOnly(e.target.checked)}
              />
              <span className={styles.toggleTrack} />
              <span>Favorites only</span>
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={filters.filters.createdByTateOnly}
                onChange={(e) => filters.setCreatedByTateOnly(e.target.checked)}
              />
              <span className={styles.toggleTrack} />
              <span>Created by Tate only</span>
            </label>
          </section>
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={filters.clearFilters} fullWidth>
            Clear all filters
          </Button>
          <Button onClick={onClose} fullWidth>
            Done
          </Button>
        </div>
      </div>
    </>
  )
}
