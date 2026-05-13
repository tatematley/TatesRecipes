import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { Recipe, Ingredient, Category, Difficulty, ALL_CATEGORIES, ALL_DIETARY_TAGS, ALL_OCCASION_TAGS, ALL_CUSTOM_TAGS, Measurement } from '../types'
import { IngredientRow } from '../components/recipes/IngredientRow'
import { TatesTips } from '../components/recipes/TatesTips'
import { Button } from '../components/ui/Button'
import { Tag } from '../components/ui/Tag'
import { generateId } from '../utils/helpers'
import styles from './AddRecipePage.module.css'

type FormData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>

const ALL_TAGS = [...ALL_DIETARY_TAGS, ...ALL_OCCASION_TAGS, ...ALL_CUSTOM_TAGS]

export function EditRecipePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getRecipe, updateRecipe } = useRecipeContext()
  const recipe = getRecipe(id!)
  const [form, setForm] = useState<FormData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (recipe) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = recipe
      setForm(rest)
    }
  }, [id])

  if (!recipe || !form) {
    return (
      <div className={styles.page}>
        <h2>Recipe not found</h2>
        <Button onClick={() => navigate('/')}>Back to Recipe Box</Button>
      </div>
    )
  }

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((f) => f ? { ...f, [field]: value } : f)
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!form!.title.trim()) newErrors.title = 'Recipe title is required'
    if (form!.ingredients.every((i) => !i.name.trim())) newErrors.ingredients = 'Add at least one ingredient'
    if (form!.instructions.every((i) => !i.text.trim())) newErrors.instructions = 'Add at least one instruction'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !form) return

    const ingredients = form.ingredients
      .filter((i) => i.name.trim())
      .map((i, idx) => ({ ...i, order: idx }))

    const instructions = form.instructions
      .filter((i) => i.text.trim())
      .map((i, idx) => ({ ...i, step: idx + 1 }))

    const totalTime = form.totalTime ?? (
      (form.prepTime ?? 0) + (form.cookTime ?? 0) || null
    )

    updateRecipe(id!, { ...form, ingredients, instructions, totalTime })
    navigate(`/recipe/${id}`)
  }

  function addIngredient() { set('ingredients', [...form!.ingredients, { id: generateId(), quantity: '', measurement: '' as Measurement, name: '', preparation: '', order: 0 }]) }
  function removeIngredient(iid: string) { if (form!.ingredients.length > 1) set('ingredients', form!.ingredients.filter((i) => i.id !== iid)) }
  function changeIngredient(iid: string, field: keyof Ingredient, value: string) { set('ingredients', form!.ingredients.map((i) => i.id === iid ? { ...i, [field]: value } : i)) }
  function addInstruction() { set('instructions', [...form!.instructions, { id: generateId(), step: 1, text: '' }]) }
  function removeInstruction(iid: string) { if (form!.instructions.length > 1) set('instructions', form!.instructions.filter((i) => i.id !== iid)) }
  function changeInstruction(iid: string, text: string) { set('instructions', form!.instructions.map((i) => i.id === iid ? { ...i, text } : i)) }
  function toggleTag(tag: string) { set('tags', form!.tags.includes(tag) ? form!.tags.filter((t) => t !== tag) : [...form!.tags, tag]) }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<span>←</span>} size="sm">Back</Button>
        <h1 className={styles.title}>Edit Recipe</h1>
        <p className={styles.subtitle}>Update the details for <strong>{form.title}</strong></p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Info</h2>
          <div className={styles.fields}>
            <div className={styles.fieldFull}>
              <label className="field-label">Recipe Title *</label>
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} className={`field-input ${errors.title ? styles.inputError : ''}`} />
              {errors.title && <span className={styles.error}>{errors.title}</span>}
            </div>
            <div className={styles.fieldFull}>
              <label className="field-label">Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="field-input" rows={3} />
            </div>
            <div>
              <label className="field-label">Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value as Category)} className="field-input select">
                {ALL_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Difficulty</label>
              <select value={form.difficulty ?? ''} onChange={(e) => set('difficulty', e.target.value as Difficulty || null)} className="field-input select">
                <option value="">— Select —</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="field-label">Hero Image URL</label>
              <input type="url" value={form.heroImage} onChange={(e) => set('heroImage', e.target.value)} className="field-input" />
            </div>
            <div>
              <label className="field-label">Servings</label>
              <input type="number" min={1} value={form.servings ?? ''} onChange={(e) => set('servings', e.target.value ? parseInt(e.target.value) : null)} className="field-input" />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Time (minutes)</h2>
          <div className={styles.timeRow}>
            {(['prepTime', 'cookTime', 'totalTime'] as const).map((field) => (
              <div key={field}>
                <label className="field-label">{field === 'prepTime' ? 'Prep' : field === 'cookTime' ? 'Cook' : 'Total'}</label>
                <input type="number" min={0} value={form[field] ?? ''} onChange={(e) => set(field, e.target.value ? parseInt(e.target.value) : null)} className="field-input" />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ingredients</h2>
          {errors.ingredients && <span className={styles.error}>{errors.ingredients}</span>}
          <div className={styles.ingredientRows}>
            {form.ingredients.map((ing, idx) => (
              <IngredientRow key={ing.id} ingredient={ing} index={idx} onChange={changeIngredient} onRemove={removeIngredient} />
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={addIngredient} icon={<span>+</span>}>Add Ingredient</Button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Instructions</h2>
          {errors.instructions && <span className={styles.error}>{errors.instructions}</span>}
          <div className={styles.instructionList}>
            {form.instructions.map((inst, idx) => (
              <div key={inst.id} className={styles.instructionRow}>
                <div className={styles.stepNum}>{idx + 1}</div>
                <textarea value={inst.text} onChange={(e) => changeInstruction(inst.id, e.target.value)} className={`field-input ${styles.instructionInput}`} rows={2} />
                <button type="button" onClick={() => removeInstruction(inst.id)} className={styles.removeBtn}>✕</button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={addInstruction} icon={<span>+</span>}>Add Step</Button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tate's Tips</h2>
          <TatesTips tips={form.tatesTips} editable onChange={(v) => set('tatesTips', v)} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tags</h2>
          <div className={styles.tagGrid}>
            {ALL_TAGS.map((tag) => (
              <button key={tag} type="button" className={[styles.tagToggle, form.tags.includes(tag) ? styles.tagActive : ''].join(' ')} onClick={() => toggleTag(tag)}>{tag}</button>
            ))}
          </div>
          {form.tags.length > 0 && (
            <div className={styles.selectedTags}>
              {form.tags.map((tag) => <Tag key={tag} label={tag} onRemove={() => toggleTag(tag)} />)}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Source & Options</h2>
          <div className={styles.fields}>
            <div>
              <label className="field-label">Source URL</label>
              <input type="url" value={form.sourceUrl ?? ''} onChange={(e) => set('sourceUrl', e.target.value)} className="field-input" />
            </div>
            <div>
              <label className="field-label">Source Name</label>
              <input type="text" value={form.sourceName ?? ''} onChange={(e) => set('sourceName', e.target.value)} className="field-input" />
            </div>
          </div>
          <div className={styles.toggleRow}>
            <label className={styles.toggle}>
              <input type="checkbox" checked={form.createdByTate} onChange={(e) => set('createdByTate', e.target.checked)} />
              <span className={styles.toggleTrack} />
              <span className={styles.toggleLabel}>Created by Tate</span>
            </label>
            <label className={styles.toggle}>
              <input type="checkbox" checked={form.isFavorite} onChange={(e) => set('isFavorite', e.target.checked)} />
              <span className={styles.toggleTrack} />
              <span className={styles.toggleLabel}>Favorite</span>
            </label>
          </div>
        </section>

        <div className={styles.formFooter}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" size="lg">Save Changes</Button>
        </div>
      </form>
    </div>
  )
}
