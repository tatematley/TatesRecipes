import { Ingredient, Measurement } from '../../types'
import { IngredientRow } from './IngredientRow'
import { Button } from '../ui/Button'
import { PlusIcon } from '../ui/Icons'
import { generateId } from '../../utils/helpers'
import styles from './IngredientsEditor.module.css'

interface Props {
  ingredients: Ingredient[]
  onChange: (ingredients: Ingredient[]) => void
  error?: string
}

interface Group {
  name: string
  ingredients: Ingredient[]
}

function toGroups(ingredients: Ingredient[]): Group[] {
  const order: string[] = []
  const map: Record<string, Ingredient[]> = {}

  for (const ing of ingredients) {
    const g = ing.group ?? ''
    if (!order.includes(g)) order.push(g)
    ;(map[g] ??= []).push(ing)
  }

  if (!order.includes('')) order.unshift('')
  map[''] ??= []

  return order.map((name) => ({ name, ingredients: map[name] ?? [] }))
}

function newIngredient(group = ''): Ingredient {
  return { id: generateId(), quantity: '', measurement: '' as Measurement, name: '', preparation: '', order: 0, group }
}

export function IngredientsEditor({ ingredients, onChange, error }: Props) {
  const groups = toGroups(ingredients)
  const hasNamedGroups = groups.some((g) => g.name !== '')

  function flat(gs: Group[]): Ingredient[] {
    return gs.flatMap((g) => g.ingredients.map((ing) => ({ ...ing, group: g.name || undefined })))
  }

  function addIngredientToGroup(groupName: string) {
    const updated = [...groups]
    const g = updated.find((g) => g.name === groupName)
    if (g) g.ingredients = [...g.ingredients, newIngredient(groupName)]
    onChange(flat(updated))
  }

  function addGroup() {
    const existingNamed = groups.filter((g) => g.name !== '')
    const newName = `Group ${existingNamed.length + 1}`
    const updated = [...groups, { name: newName, ingredients: [newIngredient(newName)] }]
    onChange(flat(updated))
  }

  function renameGroup(oldName: string, newName: string) {
    const updated = groups.map((g) =>
      g.name === oldName
        ? { ...g, name: newName, ingredients: g.ingredients.map((ing) => ({ ...ing, group: newName || undefined })) }
        : g
    )
    onChange(flat(updated))
  }

  function removeGroup(groupName: string) {
    const updated = groups.map((g) =>
      g.name === groupName
        ? { ...g, name: '', ingredients: g.ingredients.map((ing) => ({ ...ing, group: undefined })) }
        : g
    )
    // Merge ungrouped
    const ungrouped = updated.filter((g) => g.name === '').flatMap((g) => g.ingredients)
    const named = updated.filter((g) => g.name !== '')
    const merged: Group[] = [{ name: '', ingredients: ungrouped }, ...named]
    onChange(flat(merged))
  }

  function changeIngredient(id: string, field: keyof Ingredient, value: string) {
    onChange(ingredients.map((i) => i.id === id ? { ...i, [field]: value } : i))
  }

  function removeIngredient(id: string) {
    if (ingredients.length > 1) onChange(ingredients.filter((i) => i.id !== id))
  }

  return (
    <div className={styles.wrap}>
      {error && <span className={styles.errMsg}>{error}</span>}

      {groups.map((group, gi) => {
        const showHeader = group.name !== '' || (hasNamedGroups && group.ingredients.length > 0)
        const globalOffset = groups.slice(0, gi).reduce((sum, g) => sum + g.ingredients.length, 0)

        return (
          <div key={gi} className={styles.group}>
            {showHeader && (
              <div className={styles.groupHeader}>
                {group.name === '' ? (
                  <span className={styles.ungroupedLabel}>Other Ingredients</span>
                ) : (
                  <input
                    className={styles.groupInput}
                    value={group.name}
                    onChange={(e) => renameGroup(group.name, e.target.value)}
                    placeholder="Group name…"
                  />
                )}
                {group.name !== '' && (
                  <button type="button" className={styles.removeGroupBtn} onClick={() => removeGroup(group.name)}>
                    ×
                  </button>
                )}
              </div>
            )}

            <div className={styles.rows}>
              {group.ingredients.map((ing, idx) => (
                <IngredientRow
                  key={ing.id}
                  ingredient={ing}
                  index={globalOffset + idx}
                  onChange={changeIngredient}
                  onRemove={removeIngredient}
                />
              ))}
            </div>

            <Button type="button" variant="ghost" size="sm"
              onClick={() => addIngredientToGroup(group.name)}
              icon={<PlusIcon size={12} strokeWidth={2} />}
            >
              Add Ingredient
            </Button>
          </div>
        )
      })}

      <button type="button" className={styles.addGroupBtn} onClick={addGroup}>
        + Add Group
      </button>
    </div>
  )
}
