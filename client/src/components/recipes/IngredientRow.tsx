import { Ingredient, MEASUREMENTS } from '../../types'
import styles from './IngredientRow.module.css'

interface IngredientRowProps {
  ingredient: Ingredient
  index: number
  onChange: (id: string, field: keyof Ingredient, value: string) => void
  onRemove: (id: string) => void
}

export function IngredientRow({ ingredient, index, onChange, onRemove }: IngredientRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.index}>{index + 1}</span>

      <input
        type="text"
        value={ingredient.quantity}
        onChange={(e) => onChange(ingredient.id, 'quantity', e.target.value)}
        placeholder="Qty"
        className={[styles.cell, styles.qty].join(' ')}
        aria-label="Quantity"
      />

      <select
        value={ingredient.measurement}
        onChange={(e) => onChange(ingredient.id, 'measurement', e.target.value)}
        className={[styles.cell, styles.measure].join(' ')}
        aria-label="Measurement"
      >
        {MEASUREMENTS.map((m) => (
          <option key={m} value={m}>{m || '—'}</option>
        ))}
      </select>

      <input
        type="text"
        value={ingredient.name}
        onChange={(e) => onChange(ingredient.id, 'name', e.target.value)}
        placeholder="Ingredient"
        className={[styles.cell, styles.name].join(' ')}
        aria-label="Ingredient name"
      />

      <input
        type="text"
        value={ingredient.preparation}
        onChange={(e) => onChange(ingredient.id, 'preparation', e.target.value)}
        placeholder="Prep note"
        className={[styles.cell, styles.prep].join(' ')}
        aria-label="Preparation note"
      />

      <button
        type="button"
        onClick={() => onRemove(ingredient.id)}
        className={styles.removeBtn}
        aria-label="Remove ingredient"
      >
        ×
      </button>
    </div>
  )
}
