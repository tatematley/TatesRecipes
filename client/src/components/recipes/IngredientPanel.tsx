import { Recipe, Ingredient } from '../../types'
import { convertAmount, UnitSystem } from '../../utils/quantity'
import { CheckIcon, MinusIcon, PlusIcon } from '../ui/Icons'
import styles from './IngredientPanel.module.css'

interface Props {
  recipe: Recipe
  servings: number | null
  factor: number
  units: UnitSystem
  onServings: (n: number) => void
  onFactor: (f: number) => void
  onUnits: (u: UnitSystem) => void
  isChecked: (id: string) => boolean
  onToggle: (id: string) => void
  /** Ids to emphasize (cook mode: ingredients used in the current step) */
  highlight?: Set<string>
  compact?: boolean
}

export function groupIngredients(ingredients: Ingredient[]) {
  const sorted = ingredients.slice().sort((a, b) => a.order - b.order)
  const groups: { name: string; items: Ingredient[] }[] = []
  for (const ing of sorted) {
    const g = ing.group ?? ''
    const existing = groups.find((x) => x.name === g)
    if (existing) existing.items.push(ing)
    else groups.push({ name: g, items: [ing] })
  }
  return groups
}

export function IngredientPanel({ recipe, servings, factor, units, onServings, onFactor, onUnits, isChecked, onToggle, highlight, compact }: Props) {
  const groups = groupIngredients(recipe.ingredients)
  const hasServings = recipe.servings != null

  return (
    <div className={`${styles.panel} ${compact ? styles.compact : ''}`}>
      <div className={styles.controls}>
        <div className={styles.stepper}>
          <button onClick={() => (hasServings ? onServings((servings ?? 1) - 1) : onFactor(factor / 2))} aria-label="Fewer servings">
            <MinusIcon size={14} strokeWidth={2.25} />
          </button>
          <span className={styles.stepperValue}>
            {hasServings ? <><strong>{servings}</strong> {servings === 1 ? 'serving' : 'servings'}</> : <><strong>{factor}×</strong> batch</>}
          </span>
          <button onClick={() => (hasServings ? onServings((servings ?? 0) + 1) : onFactor(factor * 2))} aria-label="More servings">
            <PlusIcon size={14} strokeWidth={2.25} />
          </button>
        </div>
        <div className={styles.units} role="group" aria-label="Units">
          {(['original', 'us', 'metric'] as UnitSystem[]).map((u) => (
            <button key={u} className={units === u ? styles.unitOn : ''} onClick={() => onUnits(u)}>
              {u === 'original' ? 'As written' : u === 'us' ? 'US' : 'Metric'}
            </button>
          ))}
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.name || '_'} className={styles.group}>
          {group.name && <p className={styles.groupLabel}>{group.name}</p>}
          <ul className={styles.list}>
            {group.items.map((ing) => {
              const amt = convertAmount(ing, factor, units)
              const on = isChecked(ing.id)
              return (
                <li key={ing.id}>
                  <button
                    className={`${styles.item} ${on ? styles.on : ''} ${highlight?.has(ing.id) ? styles.hl : ''}`}
                    onClick={() => onToggle(ing.id)}
                    aria-pressed={on}
                  >
                    <span className={styles.box}>{on && <CheckIcon size={12} strokeWidth={3} />}</span>
                    <span className={styles.text}>
                      {(amt.quantity || amt.unit) && <span className={styles.amount}>{[amt.quantity, amt.unit].filter(Boolean).join(' ')} </span>}
                      <span className={styles.name}>{ing.name}</span>
                      {ing.preparation && <span className={styles.prep}>, {ing.preparation}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
