import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { Recipe, Ingredient, Instruction, Category, Difficulty, ALL_CATEGORIES, ALL_DIETARY_TAGS, ALL_OCCASION_TAGS, ALL_CUSTOM_TAGS, Measurement } from '../types'
import { IngredientRow } from '../components/recipes/IngredientRow'
import { TatesTips } from '../components/recipes/TatesTips'
import { Button } from '../components/ui/Button'
import { Tag } from '../components/ui/Tag'
import { generateId } from '../utils/helpers'
import styles from './AddRecipePage.module.css'

type FormData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>

const emptyIngredient = (): Ingredient => ({
  id: generateId(),
  quantity: '',
  measurement: '' as Measurement,
  name: '',
  preparation: '',
  order: 0,
})

const emptyInstruction = (): Instruction => ({
  id: generateId(),
  step: 1,
  text: '',
})

const defaultForm: FormData = {
  title: '',
  description: '',
  category: 'Dinner',
  prepTime: null,
  cookTime: null,
  totalTime: null,
  servings: null,
  difficulty: null,
  heroImage: '',
  sourceUrl: '',
  sourceName: '',
  createdByTate: false,
  tatesTips: '',
  tags: [],
  ingredients: [emptyIngredient()],
  instructions: [emptyInstruction()],
  photos: [],
  isFavorite: false,
}

const ALL_TAGS = [
  ...ALL_DIETARY_TAGS,
  ...ALL_OCCASION_TAGS,
  ...ALL_CUSTOM_TAGS,
]

export function AddRecipePage() {
  const navigate = useNavigate()
  const { addRecipe } = useRecipeContext()
  const [form, setForm] = useState<FormData>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!form.title.trim()) newErrors.title = 'Recipe title is required'
    if (!form.category) newErrors.category = 'Category is required'
    if (form.ingredients.every((i) => !i.name.trim()))
      newErrors.ingredients = 'Add at least one ingredient'
    if (form.instructions.every((i) => !i.text.trim()))
      newErrors.instructions = 'Add at least one instruction'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const ingredients = form.ingredients
      .filter((i) => i.name.trim())
      .map((i, idx) => ({ ...i, order: idx }))

    const instructions = form.instructions
      .filter((i) => i.text.trim())
      .map((i, idx) => ({ ...i, step: idx + 1 }))

    const totalTime = form.totalTime ?? (
      (form.prepTime ?? 0) + (form.cookTime ?? 0) || null
    )

    addRecipe({ ...form, ingredients, instructions, totalTime })
    navigate('/')
  }

  // Ingredient helpers
  function addIngredient() {
    set('ingredients', [...form.ingredients, emptyIngredient()])
  }
  function removeIngredient(id: string) {
    if (form.ingredients.length === 1) return
    set('ingredients', form.ingredients.filter((i) => i.id !== id))
  }
  function changeIngredient(id: string, field: keyof Ingredient, value: string) {
    set('ingredients', form.ingredients.map((i) =>
      i.id === id ? { ...i, [field]: value } : i
    ))
  }

  // Instruction helpers
  function addInstruction() {
    set('instructions', [...form.instructions, emptyInstruction()])
  }
  function removeInstruction(id: string) {
    if (form.instructions.length === 1) return
    set('instructions', form.instructions.filter((i) => i.id !== id))
  }
  function changeInstruction(id: string, text: string) {
    set('instructions', form.instructions.map((i) =>
      i.id === id ? { ...i, text } : i
    ))
  }

  // Tag helpers
  function toggleTag(tag: string) {
    set('tags', form.tags.includes(tag)
      ? form.tags.filter((t) => t !== tag)
      : [...form.tags, tag]
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<span>←</span>} size="sm">
          Back
        </Button>
        <h1 className={styles.title}>Add New Recipe</h1>
        <p className={styles.subtitle}>Fill in the details below to add a recipe to your kitchen.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* Basic Info */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Info</h2>
          <div className={styles.fields}>
            <div className={styles.fieldFull}>
              <label className="field-label">Recipe Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Grandma's Apple Pie"
                className={`field-input ${errors.title ? styles.inputError : ''}`}
              />
              {errors.title && <span className={styles.error}>{errors.title}</span>}
            </div>

            <div className={styles.fieldFull}>
              <label className="field-label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="A brief description of this recipe…"
                className="field-input"
                rows={3}
              />
            </div>

            <div>
              <label className="field-label">Category *</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value as Category)}
                className="field-input select"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Difficulty</label>
              <select
                value={form.difficulty ?? ''}
                onChange={(e) => set('difficulty', e.target.value as Difficulty || null)}
                className="field-input select"
              >
                <option value="">— Select —</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="field-label">Hero Image URL</label>
              <input
                type="url"
                value={form.heroImage}
                onChange={(e) => set('heroImage', e.target.value)}
                placeholder="https://…"
                className="field-input"
              />
            </div>

            <div>
              <label className="field-label">Servings</label>
              <input
                type="number"
                min={1}
                value={form.servings ?? ''}
                onChange={(e) => set('servings', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g. 4"
                className="field-input"
              />
            </div>
          </div>
        </section>

        {/* Time */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Time</h2>
          <div className={styles.timeRow}>
            {(['prepTime', 'cookTime', 'totalTime'] as const).map((field) => (
              <div key={field}>
                <label className="field-label">
                  {field === 'prepTime' ? 'Prep (min)' : field === 'cookTime' ? 'Cook (min)' : 'Total (min)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={form[field] ?? ''}
                  onChange={(e) => set(field, e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="—"
                  className="field-input"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Ingredients */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ingredients</h2>
          <p className={styles.sectionHint}>Enter quantity, measurement, ingredient name, and optional prep note.</p>
          {errors.ingredients && <span className={styles.error}>{errors.ingredients}</span>}
          <div className={styles.ingredientRows}>
            {form.ingredients.map((ing, idx) => (
              <IngredientRow
                key={ing.id}
                ingredient={ing}
                index={idx}
                onChange={changeIngredient}
                onRemove={removeIngredient}
              />
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={addIngredient} icon={<span>+</span>}>
            Add Ingredient
          </Button>
        </section>

        {/* Instructions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Instructions</h2>
          {errors.instructions && <span className={styles.error}>{errors.instructions}</span>}
          <div className={styles.instructionList}>
            {form.instructions.map((inst, idx) => (
              <div key={inst.id} className={styles.instructionRow}>
                <div className={styles.stepNum}>{idx + 1}</div>
                <textarea
                  value={inst.text}
                  onChange={(e) => changeInstruction(inst.id, e.target.value)}
                  placeholder={`Step ${idx + 1}…`}
                  className={`field-input ${styles.instructionInput}`}
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(inst.id)}
                  className={styles.removeBtn}
                  aria-label="Remove step"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={addInstruction} icon={<span>+</span>}>
            Add Step
          </Button>
        </section>

        {/* Tate's Tips */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tate's Tips</h2>
          <TatesTips tips={form.tatesTips} editable onChange={(v) => set('tatesTips', v)} />
        </section>

        {/* Tags */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tags</h2>
          <div className={styles.tagGrid}>
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={[styles.tagToggle, form.tags.includes(tag) ? styles.tagActive : ''].join(' ')}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          {form.tags.length > 0 && (
            <div className={styles.selectedTags}>
              {form.tags.map((tag) => <Tag key={tag} label={tag} onRemove={() => toggleTag(tag)} />)}
            </div>
          )}
        </section>

        {/* Source & Toggles */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Source & Options</h2>
          <div className={styles.fields}>
            <div>
              <label className="field-label">Source URL</label>
              <input
                type="url"
                value={form.sourceUrl ?? ''}
                onChange={(e) => set('sourceUrl', e.target.value)}
                placeholder="https://…"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Source Name</label>
              <input
                type="text"
                value={form.sourceName ?? ''}
                onChange={(e) => set('sourceName', e.target.value)}
                placeholder="e.g. NYT Cooking"
                className="field-input"
              />
            </div>
          </div>

          <div className={styles.toggleRow}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.createdByTate}
                onChange={(e) => set('createdByTate', e.target.checked)}
              />
              <span className={styles.toggleTrack} />
              <span className={styles.toggleLabel}>Created by Tate</span>
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.isFavorite}
                onChange={(e) => set('isFavorite', e.target.checked)}
              />
              <span className={styles.toggleTrack} />
              <span className={styles.toggleLabel}>Add to Favorites</span>
            </label>
          </div>
        </section>

        {/* Submit */}
        <div className={styles.formFooter}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" size="lg">
            Save Recipe
          </Button>
        </div>
      </form>
    </div>
  )
}
