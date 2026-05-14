import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { Recipe, Ingredient, Category, Difficulty, ALL_CATEGORIES, ALL_DIETARY_TAGS, ALL_OCCASION_TAGS, ALL_CUSTOM_TAGS, Measurement } from '../types'
import { IngredientRow } from '../components/recipes/IngredientRow'
import { TatesTips } from '../components/recipes/TatesTips'
import { Button } from '../components/ui/Button'
import { Tag } from '../components/ui/Tag'
import { ArrowLeftIcon, PlusIcon } from '../components/ui/Icons'
import { generateId } from '../utils/helpers'
import styles from './AddRecipePage.module.css'

type FormData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>

const newIngredient = (): Ingredient => ({
  id: generateId(), quantity: '', measurement: '' as Measurement,
  name: '', preparation: '', order: 0,
})

const defaultForm: FormData = {
  title: '', description: '', category: 'Dinner',
  prepTime: null, cookTime: null, totalTime: null, servings: null,
  difficulty: null, heroImage: '', sourceUrl: '', sourceName: '',
  createdByTate: false, tatesTips: '', tags: [],
  ingredients: [newIngredient()],
  instructions: [{ id: generateId(), step: 1, text: '' }],
  photos: [], isFavorite: false,
}

const ALL_TAGS = [...ALL_DIETARY_TAGS, ...ALL_OCCASION_TAGS, ...ALL_CUSTOM_TAGS]

export function AddRecipePage() {
  const navigate = useNavigate()
  const { addRecipe } = useRecipeContext()
  const [form, setForm] = useState<FormData>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (form.ingredients.every((i) => !i.name.trim())) e.ingredients = 'Add at least one ingredient'
    if (form.instructions.every((i) => !i.text.trim())) e.instructions = 'Add at least one instruction'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const ingredients = form.ingredients.filter((i) => i.name.trim()).map((i, idx) => ({ ...i, order: idx }))
      const instructions = form.instructions.filter((i) => i.text.trim()).map((i, idx) => ({ ...i, step: idx + 1 }))
      const totalTime = form.totalTime ?? ((form.prepTime ?? 0) + (form.cookTime ?? 0) || null)
      const saved = await addRecipe({ ...form, ingredients, instructions, totalTime })
      navigate(`/recipe/${saved.id}`)
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  function addIngredient() { set('ingredients', [...form.ingredients, newIngredient()]) }
  function removeIngredient(id: string) { if (form.ingredients.length > 1) set('ingredients', form.ingredients.filter((i) => i.id !== id)) }
  function changeIngredient(id: string, field: keyof Ingredient, value: string) { set('ingredients', form.ingredients.map((i) => i.id === id ? { ...i, [field]: value } : i)) }
  function addInstruction() { set('instructions', [...form.instructions, { id: generateId(), step: 1, text: '' }]) }
  function removeInstruction(id: string) { if (form.instructions.length > 1) set('instructions', form.instructions.filter((i) => i.id !== id)) }
  function changeInstruction(id: string, text: string) { set('instructions', form.instructions.map((i) => i.id === id ? { ...i, text } : i)) }
  function toggleTag(tag: string) { set('tags', form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag]) }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeftIcon size={13} strokeWidth={2} />}>Back</Button>
        <h1 className={styles.pageTitle}>Add Recipe</h1>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Info</h2>
          <div className={styles.grid2}>
            <div className={styles.span2}>
              <label className="field-label">Title *</label>
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Grandma's Apple Pie" className={`field-input ${errors.title ? styles.err : ''}`} />
              {errors.title && <span className={styles.errMsg}>{errors.title}</span>}
            </div>
            <div className={styles.span2}>
              <label className="field-label">Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                placeholder="A short description of this recipe…" className="field-input" rows={3} />
            </div>
            <div>
              <label className="field-label">Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value as Category)} className="field-input">
                {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Difficulty</label>
              <select value={form.difficulty ?? ''} onChange={(e) => set('difficulty', (e.target.value as Difficulty) || null)} className="field-input">
                <option value="">Select…</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="field-label">Servings</label>
              <input type="number" min={1} value={form.servings ?? ''} onChange={(e) => set('servings', e.target.value ? parseInt(e.target.value) : null)} placeholder="4" className="field-input" />
            </div>
            <div>
              <label className="field-label">Hero Image URL</label>
              <input type="url" value={form.heroImage} onChange={(e) => set('heroImage', e.target.value)} placeholder="https://…" className="field-input" />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Time (minutes)</h2>
          <div className={styles.grid3}>
            {(['prepTime', 'cookTime', 'totalTime'] as const).map((f) => (
              <div key={f}>
                <label className="field-label">{f === 'prepTime' ? 'Prep' : f === 'cookTime' ? 'Cook' : 'Total'}</label>
                <input type="number" min={0} value={form[f] ?? ''} onChange={(e) => set(f, e.target.value ? parseInt(e.target.value) : null)} placeholder="—" className="field-input" />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ingredients</h2>
          <p className={styles.hint}>Quantity · Measurement · Ingredient · Prep note (optional)</p>
          {errors.ingredients && <span className={styles.errMsg}>{errors.ingredients}</span>}
          <div className={styles.rows}>
            {form.ingredients.map((ing, idx) => (
              <IngredientRow key={ing.id} ingredient={ing} index={idx} onChange={changeIngredient} onRemove={removeIngredient} />
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={addIngredient} icon={<PlusIcon size={12} strokeWidth={2} />}>
            Add Ingredient
          </Button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Instructions</h2>
          {errors.instructions && <span className={styles.errMsg}>{errors.instructions}</span>}
          <div className={styles.rows}>
            {form.instructions.map((inst, idx) => (
              <div key={inst.id} className={styles.instrRow}>
                <span className={styles.instrNum}>{idx + 1}</span>
                <textarea value={inst.text} onChange={(e) => changeInstruction(inst.id, e.target.value)}
                  placeholder={`Step ${idx + 1}…`} className={`field-input ${styles.instrInput}`} rows={2} />
                <button type="button" onClick={() => removeInstruction(inst.id)} className={styles.removeBtn}>×</button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={addInstruction} icon={<PlusIcon size={12} strokeWidth={2} />}>
            Add Step
          </Button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tate's Tips</h2>
          <TatesTips tips={form.tatesTips} editable onChange={(v) => set('tatesTips', v)} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tags</h2>
          <div className={styles.tagGrid}>
            {ALL_TAGS.map((tag) => (
              <button key={tag} type="button"
                className={[styles.tagBtn, form.tags.includes(tag) ? styles.tagOn : ''].join(' ')}
                onClick={() => toggleTag(tag)}>
                {tag}
              </button>
            ))}
          </div>
          {form.tags.length > 0 && (
            <div className={styles.selectedTags}>
              {form.tags.map((t) => <Tag key={t} label={t} onRemove={() => toggleTag(t)} />)}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Source</h2>
          <div className={styles.grid2}>
            <div>
              <label className="field-label">Source URL</label>
              <input type="url" value={form.sourceUrl ?? ''} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://…" className="field-input" />
            </div>
            <div>
              <label className="field-label">Source Name</label>
              <input type="text" value={form.sourceName ?? ''} onChange={(e) => set('sourceName', e.target.value)} placeholder="e.g. NYT Cooking" className="field-input" />
            </div>
          </div>
          <div className={styles.toggles}>
            <label className={styles.toggle}>
              <input type="checkbox" checked={form.createdByTate} onChange={(e) => set('createdByTate', e.target.checked)} />
              <span className={styles.track} />
              <span>Created by Tate</span>
            </label>
            <label className={styles.toggle}>
              <input type="checkbox" checked={form.isFavorite} onChange={(e) => set('isFavorite', e.target.checked)} />
              <span className={styles.track} />
              <span>Add to Favorites</span>
            </label>
          </div>
        </section>

        <div className={styles.footer}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Recipe'}</Button>
        </div>
      </form>
    </div>
  )
}
