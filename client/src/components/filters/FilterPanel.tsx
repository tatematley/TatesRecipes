import { useEffect } from 'react'
import styles from './FilterPanel.module.css'
import { useFilters } from '../../hooks/useFilters'
import { ALL_DIETARY_TAGS, ALL_CATEGORIES } from '../../types'
import { XIcon } from '../ui/Icons'

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  filters: ReturnType<typeof useFilters>
}

const TIME_OPTIONS = [
  { value: 'under30', label: 'Under 30 min' },
  { value: 'under60', label: 'Under 1 hour' },
  { value: 'over60',  label: 'Over 1 hour' },
]

/** A short white slide-out: what kind of dish, how long, and any diet. */
export function FilterPanel({ isOpen, onClose, filters }: FilterPanelProps) {
  const f = filters.filters

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}
      <div className={[styles.panel, isOpen ? styles.open : ''].join(' ')} aria-hidden={!isOpen}>
        <div className={styles.header}>
          <span className={styles.title}>Filters</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close filters">
            <XIcon size={18} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.body}>
          <section>
            <p className={styles.label}>Type</p>
            <div className={styles.chips}>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={[styles.chip, f.category === cat ? styles.chipOn : ''].join(' ')}
                  onClick={() => filters.setCategory(f.category === cat ? '' : cat)}
                >{cat}</button>
              ))}
            </div>
          </section>

          <section>
            <p className={styles.label}>Time</p>
            <div className={styles.chips}>
              {TIME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={[styles.chip, f.timeFilter === value ? styles.chipOn : ''].join(' ')}
                  onClick={() => filters.setTimeFilter(f.timeFilter === value ? '' : value)}
                >{label}</button>
              ))}
            </div>
          </section>

          <section>
            <p className={styles.label}>Diet</p>
            <div className={styles.chips}>
              {ALL_DIETARY_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={[styles.chip, f.dietaryTags.includes(tag) ? styles.chipOn : ''].join(' ')}
                  onClick={() => filters.toggleDietaryTag(tag)}
                >{tag}</button>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.footer}>
          <button className={styles.clear} onClick={filters.clearFilters}>Clear</button>
          <button className={styles.done} onClick={onClose}>Show recipes</button>
        </div>
      </div>
    </>
  )
}
