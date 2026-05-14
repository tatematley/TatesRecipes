import { useEffect } from 'react'
import styles from './FilterPanel.module.css'
import { useFilters } from '../../hooks/useFilters'
import { ALL_DIETARY_TAGS, ALL_OCCASION_TAGS, ALL_HOLIDAY_TAGS, ALL_CATEGORIES } from '../../types'
import { Button } from '../ui/Button'
import { XIcon } from '../ui/Icons'

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
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}
      <div className={[styles.panel, isOpen ? styles.open : ''].join(' ')}>
        <div className={styles.header}>
          <span className={styles.title}>Filters</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close filters">
            <XIcon size={14} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <p className={styles.label}>Category</p>
            <div className={styles.chips}>
              <button
                className={[styles.chip, !filters.filters.category ? styles.chipOn : ''].join(' ')}
                onClick={() => filters.setCategory('')}
              >All</button>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={[styles.chip, filters.filters.category === cat ? styles.chipOn : ''].join(' ')}
                  onClick={() => filters.setCategory(filters.filters.category === cat ? '' : cat)}
                >{cat}</button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <p className={styles.label}>Total Time</p>
            <div className={styles.chips}>
              {TIME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={[styles.chip, filters.filters.timeFilter === value ? styles.chipOn : ''].join(' ')}
                  onClick={() => filters.setTimeFilter(filters.filters.timeFilter === value ? '' : value)}
                >{label}</button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <p className={styles.label}>Difficulty</p>
            <div className={styles.chips}>
              {DIFFICULTIES.map(({ value, label }) => (
                <button
                  key={value}
                  className={[styles.chip, filters.filters.difficulty === value ? styles.chipOn : ''].join(' ')}
                  onClick={() => filters.setDifficulty(filters.filters.difficulty === value ? '' : value)}
                >{label}</button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <p className={styles.label}>Dietary</p>
            <div className={styles.chips}>
              {ALL_DIETARY_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={[styles.chip, filters.filters.dietaryTags.includes(tag) ? styles.chipOn : ''].join(' ')}
                  onClick={() => filters.toggleDietaryTag(tag)}
                >{tag}</button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <p className={styles.label}>Occasion</p>
            <div className={styles.chips}>
              {ALL_OCCASION_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={[styles.chip, filters.filters.occasionTags.includes(tag) ? styles.chipOn : ''].join(' ')}
                  onClick={() => filters.toggleOccasionTag(tag)}
                >{tag}</button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <p className={styles.label}>Holidays</p>
            <div className={styles.chips}>
              {ALL_HOLIDAY_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={[styles.chip, filters.filters.occasionTags.includes(tag) ? styles.chipOn : ''].join(' ')}
                  onClick={() => filters.toggleOccasionTag(tag)}
                >{tag}</button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <p className={styles.label}>Show Only</p>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={filters.filters.favoritesOnly}
                onChange={(e) => filters.setFavoritesOnly(e.target.checked)}
              />
              <span className={styles.track} />
              <span>Favorites only</span>
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={filters.filters.createdByTateOnly}
                onChange={(e) => filters.setCreatedByTateOnly(e.target.checked)}
              />
              <span className={styles.track} />
              <span>Created by Tate only</span>
            </label>
          </section>
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={filters.clearFilters} fullWidth>Clear all</Button>
          <Button onClick={onClose} fullWidth>Done</Button>
        </div>
      </div>
    </>
  )
}
