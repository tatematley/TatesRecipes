import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { Recipe, Ingredient, Category, Difficulty, ALL_CATEGORIES, ALL_DIETARY_TAGS, ALL_OCCASION_TAGS, ALL_HOLIDAY_TAGS, ALL_CUSTOM_TAGS, Measurement, Photo } from '../types'
import { IngredientsEditor } from '../components/recipes/IngredientsEditor'
import { TatesTips } from '../components/recipes/TatesTips'
import { ImportRecipe } from '../components/recipes/ImportRecipe'
import { Button } from '../components/ui/Button'
import { Tag } from '../components/ui/Tag'
import { ArrowLeftIcon, PlusIcon } from '../components/ui/Icons'
import { generateId } from '../utils/helpers'
import { uploadPhoto } from '../lib/db'
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

const ALL_TAGS = [...ALL_DIETARY_TAGS, ...ALL_OCCASION_TAGS, ...ALL_HOLIDAY_TAGS, ...ALL_CUSTOM_TAGS]

interface PendingPhoto {
  id: string
  file: File
  preview: string
  caption: string
}

export function AddRecipePage() {
  const navigate = useNavigate()
  const { addRecipe } = useRecipeContext()
  const [form, setForm] = useState<FormData>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreview, setHeroPreview] = useState<string | null>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)

  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])
  const photosInputRef = useRef<HTMLInputElement>(null)

  const folderId = useRef(crypto.randomUUID())

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  function handleHeroFile(file: File) {
    setHeroFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setHeroPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    set('heroImage', '')
  }

  function handlePhotosAdd(files: FileList) {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPendingPhotos((prev) => [...prev, {
          id: generateId(),
          file,
          preview: e.target?.result as string,
          caption: '',
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleImport(parsed: any) {
    setForm((f) => ({
      ...f,
      title: parsed.title ?? f.title,
      description: parsed.description ?? f.description,
      category: (parsed.category as Category) ?? f.category,
      prepTime: parsed.prepTime ?? f.prepTime,
      cookTime: parsed.cookTime ?? f.cookTime,
      totalTime: parsed.totalTime ?? f.totalTime,
      servings: parsed.servings ?? f.servings,
      difficulty: (parsed.difficulty as Difficulty) ?? f.difficulty,
      sourceUrl: parsed.sourceUrl ?? f.sourceUrl,
      sourceName: parsed.sourceName ?? f.sourceName,
      tatesTips: parsed.tatesTips ?? f.tatesTips,
      tags: parsed.tags?.length ? parsed.tags : f.tags,
      ingredients: parsed.ingredients?.length
        ? parsed.ingredients.map((ing: any, i: number) => ({ ...newIngredient(), ...ing, order: i }))
        : f.ingredients,
      instructions: parsed.instructions?.length
        ? parsed.instructions.map((inst: any) => ({ id: generateId(), step: inst.step, text: inst.text }))
        : f.instructions,
    }))
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
      const id = folderId.current

      let heroImage = form.heroImage
      if (heroFile) {
        heroImage = await uploadPhoto(id, heroFile)
      }

      const uploadedPhotos: Photo[] = await Promise.all(
        pendingPhotos.map(async (p) => {
          const url = await uploadPhoto(id, p.file)
          return { id: p.id, url, caption: p.caption || undefined }
        })
      )

      const ingredients = form.ingredients.filter((i) => i.name.trim()).map((i, idx) => ({ ...i, order: idx }))
      const instructions = form.instructions.filter((i) => i.text.trim()).map((i, idx) => ({ ...i, step: idx + 1 }))
      const totalTime = form.totalTime ?? ((form.prepTime ?? 0) + (form.cookTime ?? 0) || null)

      const saved = await addRecipe({ ...form, heroImage, photos: uploadedPhotos, ingredients, instructions, totalTime })
      navigate(`/recipe/${saved.id}`, { replace: true })
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

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

        <ImportRecipe onImport={handleImport} />

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
              <label className="field-label">Hero Image</label>
              <div
                className={`${styles.heroUpload} ${heroPreview ? styles.heroHasImage : ''}`}
                onClick={() => heroInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleHeroFile(f) }}
                onDragOver={(e) => e.preventDefault()}
              >
                {heroPreview ? (
                  <img src={heroPreview} className={styles.heroPreviewImg} alt="Hero" />
                ) : (
                  <span className={styles.heroPlaceholder}>Click or drop an image</span>
                )}
                <input ref={heroInputRef} type="file" accept="image/*" className={styles.hidden}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroFile(f) }} />
              </div>
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
          <IngredientsEditor
            ingredients={form.ingredients}
            onChange={(ings) => set('ingredients', ings)}
            error={errors.ingredients}
          />
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

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Photos</h2>
          <p className={styles.hint}>Add extra photos of the finished dish</p>
          <div className={styles.photoGrid}>
            {pendingPhotos.map((p) => (
              <div key={p.id} className={styles.photoThumb}>
                <img src={p.preview} alt="" className={styles.thumbImg} />
                <input
                  type="text"
                  className={`field-input ${styles.captionInput}`}
                  placeholder="Caption (optional)"
                  value={p.caption}
                  onChange={(e) => setPendingPhotos((prev) => prev.map((x) => x.id === p.id ? { ...x, caption: e.target.value } : x))}
                />
                <button type="button" className={styles.removePhotoBtn}
                  onClick={() => setPendingPhotos((prev) => prev.filter((x) => x.id !== p.id))}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" className={styles.addPhotoBtn} onClick={() => photosInputRef.current?.click()}>
              <span className={styles.addPhotoIcon}>+</span>
              <span>Add Photo</span>
            </button>
          </div>
          <input ref={photosInputRef} type="file" accept="image/*" multiple className={styles.hidden}
            onChange={(e) => { if (e.target.files) handlePhotosAdd(e.target.files) }} />
        </section>

        <div className={styles.footer}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Recipe'}</Button>
        </div>
      </form>
    </div>
  )
}
