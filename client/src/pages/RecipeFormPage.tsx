import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import {
  Recipe, Ingredient, Category, Difficulty, Measurement, Photo,
  ALL_CATEGORIES, ALL_DIETARY_TAGS, ALL_OCCASION_TAGS, ALL_HOLIDAY_TAGS, ALL_CUSTOM_TAGS,
} from '../types'
import { IngredientsEditor } from '../components/recipes/IngredientsEditor'
import { ImportRecipe } from '../components/recipes/ImportRecipe'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { RecipeCover } from '../components/ui/RecipeCover'
import { CategoryIcon } from '../components/ui/FoodIcons'
import { useToast } from '../components/ui/Toast'
import { ArrowLeftIcon, CameraIcon, PlusIcon, XIcon, ChevronDownIcon, CopyIcon, ChefHatIcon, HeartIcon, HomeIcon, SparkleIcon } from '../components/ui/Icons'
import { generateId } from '../utils/helpers'
import { parseIngredientLine } from '../utils/quantity'
import { uploadPhoto } from '../lib/db'
import styles from './RecipeFormPage.module.css'

type FormData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>

const newIngredient = (overrides: Partial<Ingredient> = {}): Ingredient => ({
  id: generateId(), quantity: '', measurement: '' as Measurement, name: '', preparation: '', order: 0, ...overrides,
})

const blankForm = (): FormData => ({
  title: '', description: '', category: 'Dinner',
  prepTime: null, cookTime: null, totalTime: null, servings: null,
  difficulty: null, heroImage: '', sourceUrl: '', sourceName: '',
  createdByTate: false, tatesTips: '', tags: [],
  ingredients: [newIngredient()],
  instructions: [{ id: generateId(), step: 1, text: '' }],
  photos: [], isFavorite: false, isPublic: true,
})

const TAG_GROUPS = [
  { label: 'Dietary', tags: ALL_DIETARY_TAGS as readonly string[] },
  { label: 'Occasion', tags: ALL_OCCASION_TAGS as readonly string[] },
  { label: 'Holidays', tags: ALL_HOLIDAY_TAGS as readonly string[] },
  { label: 'Vibes', tags: ALL_CUSTOM_TAGS as readonly string[] },
]
const KNOWN_TAGS = new Set(TAG_GROUPS.flatMap((g) => g.tags))

interface PendingPhoto { id: string; file: File; preview: string; caption: string }

/** Add and edit share one form. */
/** Add or edit a recipe. With onClose it renders inside the add pop-up. */
export function RecipeFormPage({ onClose }: { onClose?: () => void } = {}) {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()
  const { getRecipe, addRecipe, updateRecipe, loading } = useRecipeContext()
  const existing = id ? getRecipe(id) : undefined

  const [form, setForm] = useState<FormData>(blankForm)
  const [loaded, setLoaded] = useState(!isEdit)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [importOpen, setImportOpen] = useState(!isEdit)
  const [pasteOpen, setPasteOpen] = useState<null | 'ingredients' | 'steps'>(null)
  const [pasteText, setPasteText] = useState('')
  const [customTag, setCustomTag] = useState('')

  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreview, setHeroPreview] = useState<string | null>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])
  const photosInputRef = useRef<HTMLInputElement>(null)
  const folderId = useRef(crypto.randomUUID())

  useEffect(() => {
    if (existing && !loaded) {
      const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = existing
      setForm({ ...rest, ingredients: rest.ingredients.length ? rest.ingredients : [newIngredient()], instructions: rest.instructions.length ? rest.instructions : [{ id: generateId(), step: 1, text: '' }] })
      setLoaded(true)
    }
  }, [existing, loaded])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return
    const fn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', fn)
    return () => window.removeEventListener('beforeunload', fn)
  }, [dirty])

  // ⌘/Ctrl + S saves. Bound every render so it sees the latest form; sits above the early return to keep hook order stable.
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); handleSubmit() }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  })

  if (isEdit && !existing) {
    return (
      <div className={styles.notFound}>
        <h2>{loading ? 'Loading…' : 'Recipe not found'}</h2>
        {!loading && <Button variant="secondary" onClick={() => navigate('/')}>Back to recipes</Button>}
      </div>
    )
  }

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [field]: value }))
    setDirty(true)
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  function readFile(file: File, cb: (url: string) => void) {
    const reader = new FileReader()
    reader.onload = (e) => cb(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleHeroFile(file: File) {
    setHeroFile(file)
    readFile(file, setHeroPreview)
    setDirty(true)
  }

  function handlePhotosAdd(files: FileList) {
    Array.from(files).forEach((file) =>
      readFile(file, (preview) => setPendingPhotos((prev) => [...prev, { id: generateId(), file, preview, caption: '' }])),
    )
    setDirty(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleImport(parsed: any) {
    setForm((f) => ({
      ...f,
      title: parsed.title || f.title,
      description: parsed.description || f.description,
      category: (ALL_CATEGORIES.includes(parsed.category) ? parsed.category : f.category) as Category,
      prepTime: parsed.prepTime ?? f.prepTime,
      cookTime: parsed.cookTime ?? f.cookTime,
      totalTime: parsed.totalTime ?? f.totalTime,
      servings: parsed.servings ?? f.servings,
      difficulty: (parsed.difficulty as Difficulty) ?? f.difficulty,
      sourceUrl: parsed.sourceUrl || f.sourceUrl,
      sourceName: parsed.sourceName || f.sourceName,
      tatesTips: parsed.tatesTips || f.tatesTips,
      tags: parsed.tags?.length ? parsed.tags : f.tags,
      ingredients: parsed.ingredients?.length
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? parsed.ingredients.map((ing: any, i: number) => newIngredient({ ...ing, group: ing.group || undefined, order: i }))
        : f.ingredients,
      instructions: parsed.instructions?.length
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? parsed.instructions.map((inst: any, i: number) => ({ id: generateId(), step: i + 1, text: inst.text }))
        : f.instructions,
    }))
    setDirty(true)
    setImportOpen(false)
    toast('Imported! Give it a once-over, then save.')
  }

  function applyPaste() {
    const lines = pasteText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (pasteOpen === 'ingredients') {
      const parsed = lines.map(parseIngredientLine).filter(Boolean).map((p) => newIngredient(p!))
      const kept = form.ingredients.filter((i) => i.name.trim())
      set('ingredients', [...kept, ...parsed].map((x, i) => ({ ...x, order: i })))
    } else if (pasteOpen === 'steps') {
      const steps = lines.map((l) => l.replace(/^(step\s*)?\d+[.):]\s*/i, ''))
      const kept = form.instructions.filter((i) => i.text.trim())
      set('instructions', [...kept, ...steps.map((text) => ({ id: generateId(), step: 0, text }))].map((x, i) => ({ ...x, step: i + 1 })))
    }
    setPasteOpen(null)
    setPasteText('')
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Give it a name'
    if (form.ingredients.every((i) => !i.name.trim())) e.ingredients = 'Add at least one ingredient'
    if (form.instructions.every((i) => !i.text.trim())) e.instructions = 'Add at least one step'
    setErrors(e)
    if (Object.keys(e).length) {
      document.querySelector(`[data-field="${Object.keys(e)[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev?: React.FormEvent) {
    ev?.preventDefault()
    if (!validate()) return
    setSaving(true)
    setSaveError(null)
    try {
      const folder = id ?? folderId.current
      let heroImage = form.heroImage
      if (heroFile) heroImage = await uploadPhoto(folder, heroFile)

      const uploaded: Photo[] = await Promise.all(
        pendingPhotos.map(async (p) => ({ id: p.id, url: await uploadPhoto(folder, p.file), caption: p.caption || undefined })),
      )

      const ingredients = form.ingredients.filter((i) => i.name.trim()).map((i, idx) => ({ ...i, order: idx }))
      const instructions = form.instructions.filter((i) => i.text.trim()).map((i, idx) => ({ ...i, step: idx + 1 }))
      const totalTime = form.totalTime ?? ((form.prepTime ?? 0) + (form.cookTime ?? 0) || null)
      const data = { ...form, heroImage, photos: [...form.photos, ...uploaded], ingredients, instructions, totalTime }

      setDirty(false)
      if (id) {
        await updateRecipe(id, data)
        toast('Saved')
        navigate(`/recipe/${id}`, { replace: true })
      } else {
        const saved = await addRecipe(data)
        toast('Recipe added to your box')
        navigate(`/recipe/${saved.id}`, { replace: true })
      }
    } catch (err) {
      console.error(err)
      setSaveError(err instanceof Error ? err.message : 'Something went wrong while saving.')
      setSaving(false)
    }
  }

  const steps = form.instructions
  function updateStep(stepId: string, text: string) { set('instructions', steps.map((s) => (s.id === stepId ? { ...s, text } : s))) }
  function removeStep(stepId: string) { if (steps.length > 1) set('instructions', steps.filter((s) => s.id !== stepId)) }
  function moveStep(i: number, d: -1 | 1) {
    const j = i + d
    if (j < 0 || j >= steps.length) return
    const next = [...steps]
    ;[next[i], next[j]] = [next[j], next[i]]
    set('instructions', next)
  }
  function toggleTag(tag: string) { set('tags', form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag]) }
  function addCustomTag() {
    const t = customTag.trim()
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t])
    setCustomTag('')
  }

  function close() {
    if (dirty && !window.confirm('Discard this recipe?')) return
    if (onClose) onClose()
    else navigate(-1)
  }

  const coverPreview = heroPreview ?? form.heroImage
  const customTags = form.tags.filter((t) => !KNOWN_TAGS.has(t))

  return (
    <div className={onClose ? styles.inModal : styles.page}>
      <div className={styles.header}>
        {onClose
          ? <button type="button" className={styles.closeBtn} onClick={close} aria-label="Close"><XIcon size={20} strokeWidth={2} /></button>
          : <Button variant="ghost" size="sm" onClick={close} icon={<ArrowLeftIcon size={15} strokeWidth={2} />}>Back</Button>}
        <div className={styles.headerText}>
          <p className="eyebrow">{isEdit ? 'Editing' : 'New recipe'}</p>
          <h1 className={styles.title}>{isEdit ? form.title || 'Untitled' : <>Add to the <em>box</em></>}</h1>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {!isEdit && (
          <section className={`${styles.card} ${styles.importCard}`}>
            <button type="button" className={styles.importToggle} onClick={() => setImportOpen((o) => !o)} aria-expanded={importOpen}>
              <span className={styles.importIcon}><SparkleIcon size={18} /></span>
              <span className={styles.importText}>
                <strong>Import with AI</strong>
                <span>Paste a link or snap a cookbook page and the fields fill themselves.</span>
              </span>
              <ChevronDownIcon size={18} className={importOpen ? styles.chevOpen : styles.chev} />
            </button>
            {importOpen && <div className={styles.importBody}><ImportRecipe bare onImport={handleImport} /></div>}
          </section>
        )}

        <div className={styles.columns}>
          <div className={styles.main}>
            {/* Basics */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>The basics</h2>
              <div data-field="title">
                <input
                  className={`${styles.titleInput} ${errors.title ? styles.err : ''}`}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Recipe name"
                  aria-label="Recipe name"
                />
                {errors.title && <span className={styles.errMsg}>{errors.title}</span>}
              </div>
              <textarea
                className="field-input"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="A line or two about it. What makes it good? When do you make it?"
                rows={3}
                aria-label="Description"
              />
              <div>
                <span className="field-label">Category</span>
                <div className={styles.catGrid}>
                  {ALL_CATEGORIES.map((c) => (
                    <button key={c} type="button" className={`${styles.catChip} ${form.category === c ? styles.on : ''}`} onClick={() => set('category', c as Category)}>
                      <CategoryIcon category={c} size={15} />{c}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.grid4}>
                {(['prepTime', 'cookTime', 'totalTime'] as const).map((f) => (
                  <label key={f}>
                    <span className="field-label">{f === 'prepTime' ? 'Prep (min)' : f === 'cookTime' ? 'Cook (min)' : 'Total (min)'}</span>
                    <input
                      type="number" min={0} inputMode="numeric" className="field-input"
                      value={form[f] ?? ''}
                      placeholder={f === 'totalTime' && (form.prepTime || form.cookTime) ? String((form.prepTime ?? 0) + (form.cookTime ?? 0)) : '—'}
                      onChange={(e) => set(f, e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </label>
                ))}
                <label>
                  <span className="field-label">Servings</span>
                  <input type="number" min={1} inputMode="numeric" className="field-input" value={form.servings ?? ''} placeholder="4"
                    onChange={(e) => set('servings', e.target.value ? parseInt(e.target.value) : null)} />
                </label>
              </div>
              <div>
                <span className="field-label">Difficulty</span>
                <div className={styles.segment}>
                  {([null, 'easy', 'medium', 'advanced'] as (Difficulty | null)[]).map((d) => (
                    <button key={d ?? 'none'} type="button" className={form.difficulty === d ? styles.segOn : ''} onClick={() => set('difficulty', d)}>
                      {d ? d[0].toUpperCase() + d.slice(1) : 'Not set'}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Ingredients */}
            <section className={styles.card} data-field="ingredients">
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>Ingredients</h2>
                <Button type="button" variant="ghost" size="sm" icon={<CopyIcon size={14} />} onClick={() => { setPasteText(''); setPasteOpen('ingredients') }}>Paste a list</Button>
              </div>
              <IngredientsEditor ingredients={form.ingredients} onChange={(ings) => set('ingredients', ings)} error={errors.ingredients} />
            </section>

            {/* Steps */}
            <section className={styles.card} data-field="instructions">
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>Method</h2>
                <Button type="button" variant="ghost" size="sm" icon={<CopyIcon size={14} />} onClick={() => { setPasteText(''); setPasteOpen('steps') }}>Paste steps</Button>
              </div>
              {errors.instructions && <span className={styles.errMsg}>{errors.instructions}</span>}
              <ol className={styles.steps}>
                {steps.map((s, i) => (
                  <li key={s.id} className={styles.stepRow}>
                    <span className={styles.stepNum}>{i + 1}</span>
                    <textarea
                      className={`field-input ${styles.stepInput}`}
                      value={s.text}
                      rows={2}
                      placeholder={i === 0 ? 'Heat the oven to 375°F…' : 'Then…'}
                      onChange={(e) => updateStep(s.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault()
                          set('instructions', [...steps.slice(0, i + 1), { id: generateId(), step: 0, text: '' }, ...steps.slice(i + 1)])
                        }
                      }}
                    />
                    <div className={styles.stepTools}>
                      <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                      <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} aria-label="Move down">↓</button>
                      <button type="button" onClick={() => removeStep(s.id)} aria-label="Remove step"><XIcon size={13} strokeWidth={2} /></button>
                    </div>
                  </li>
                ))}
              </ol>
              <Button type="button" variant="secondary" size="sm" onClick={() => set('instructions', [...steps, { id: generateId(), step: 0, text: '' }])} icon={<PlusIcon size={14} strokeWidth={2} />}>
                Add step
              </Button>
              <p className={styles.hint}>Times like “bake 25 minutes” become tap-to-start timers on the recipe page.</p>
            </section>

            {/* Tips */}
            <section className={`${styles.card} ${styles.tipsCard}`}>
              <h2 className={styles.cardTitle}>Tate's tips</h2>
              <textarea
                className={styles.tipsInput}
                value={form.tatesTips}
                rows={4}
                onChange={(e) => set('tatesTips', e.target.value)}
                placeholder="Notes to future me: swaps, what to watch for, who loved it…"
              />
            </section>
          </div>

          <aside className={styles.side}>
            {/* Cover */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Cover photo</h2>
              <div
                className={styles.cover}
                onClick={() => heroInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleHeroFile(f) }}
                onDragOver={(e) => e.preventDefault()}
                role="button"
                tabIndex={0}
              >
                <RecipeCover recipe={{ title: form.title || 'New recipe', category: form.category, heroImage: coverPreview }} />
                <span className={styles.coverHint}><CameraIcon size={15} /> {coverPreview ? 'Change photo' : 'Add a photo'}</span>
                <input ref={heroInputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroFile(f) }} />
              </div>
              {coverPreview && (
                <button type="button" className={styles.linkBtn} onClick={() => { setHeroFile(null); setHeroPreview(null); set('heroImage', '') }}>Remove photo</button>
              )}
              {!coverPreview && <p className={styles.hint}>No photo? A cover is designed for you from the name and category.</p>}
            </section>

            {/* Flags */}
            <section className={styles.card}>
              <label className={styles.toggle}>
                <span className={styles.toggleText}><HomeIcon size={16} /> On the main page</span>
                <input type="checkbox" checked={form.isPublic} onChange={(e) => set('isPublic', e.target.checked)} />
                <span className={styles.track} />
              </label>
              <label className={styles.toggle}>
                <span className={styles.toggleText}><ChefHatIcon size={16} /> Created by Tate</span>
                <input type="checkbox" checked={form.createdByTate} onChange={(e) => set('createdByTate', e.target.checked)} />
                <span className={styles.track} />
              </label>
              <label className={styles.toggle}>
                <span className={styles.toggleText}><HeartIcon size={16} /> Favorite</span>
                <input type="checkbox" checked={form.isFavorite} onChange={(e) => set('isFavorite', e.target.checked)} />
                <span className={styles.track} />
              </label>
            </section>

            {/* Tags */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Tags</h2>
              {TAG_GROUPS.map((g) => (
                <div key={g.label} className={styles.tagGroup}>
                  <span className="field-label">{g.label}</span>
                  <div className={styles.tagGrid}>
                    {g.tags.map((t) => (
                      <button key={t} type="button" className={`${styles.tagChip} ${form.tags.includes(t) ? styles.on : ''}`} onClick={() => toggleTag(t)}>{t}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div className={styles.tagGroup}>
                <span className="field-label">Your own</span>
                <div className={styles.tagGrid}>
                  {customTags.map((t) => (
                    <button key={t} type="button" className={`${styles.tagChip} ${styles.on}`} onClick={() => toggleTag(t)}>{t} ×</button>
                  ))}
                  <input
                    className={styles.tagInput}
                    value={customTag}
                    placeholder="+ new tag"
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
                    onBlur={addCustomTag}
                  />
                </div>
              </div>
            </section>

            {/* Source */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Where it's from</h2>
              <input type="url" className="field-input" value={form.sourceUrl ?? ''} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://…" aria-label="Source URL" />
              <input type="text" className="field-input" value={form.sourceName ?? ''} onChange={(e) => set('sourceName', e.target.value)} placeholder="Source name, e.g. Grandma, NYT Cooking" aria-label="Source name" />
            </section>

            {/* Extra photos */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>More photos</h2>
              <div className={styles.photoGrid}>
                {form.photos.map((p) => (
                  <div key={p.id} className={styles.thumb}>
                    <img src={p.url} alt="" />
                    <button type="button" onClick={() => set('photos', form.photos.filter((x) => x.id !== p.id))} aria-label="Remove photo"><XIcon size={12} strokeWidth={2.5} /></button>
                  </div>
                ))}
                {pendingPhotos.map((p) => (
                  <div key={p.id} className={styles.thumb}>
                    <img src={p.preview} alt="" />
                    <button type="button" onClick={() => setPendingPhotos((prev) => prev.filter((x) => x.id !== p.id))} aria-label="Remove photo"><XIcon size={12} strokeWidth={2.5} /></button>
                  </div>
                ))}
                <button type="button" className={styles.addThumb} onClick={() => photosInputRef.current?.click()}>
                  <PlusIcon size={20} />
                </button>
              </div>
              <input ref={photosInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) handlePhotosAdd(e.target.files) }} />
            </section>
          </aside>
        </div>

        <div className={styles.saveBar}>
          {saveError && <span className={styles.errMsg}>{saveError}</span>}
          <span className={styles.saveHint}>{dirty ? 'Unsaved changes' : ''}</span>
          <Button type="button" variant="ghost" onClick={close} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save recipe'}</Button>
        </div>
      </form>

      <Modal
        isOpen={!!pasteOpen}
        onClose={() => setPasteOpen(null)}
        title={pasteOpen === 'ingredients' ? 'Paste ingredients' : 'Paste steps'}
        footer={<><Button variant="ghost" onClick={() => setPasteOpen(null)}>Cancel</Button><Button onClick={applyPaste} disabled={!pasteText.trim()}>Add them</Button></>}
      >
        <p className={styles.hint}>
          {pasteOpen === 'ingredients'
            ? 'One per line, like “1 1/2 cups flour, sifted”. Amounts and units are split out for you.'
            : 'One step per line. Numbers at the start are cleaned up.'}
        </p>
        <textarea
          autoFocus
          className="field-input"
          rows={10}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={pasteOpen === 'ingredients' ? '2 cups flour\n1 tsp baking soda\n3 cloves garlic, minced' : '1. Heat the oven…\n2. Mix the dry ingredients…'}
          style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}
        />
      </Modal>
    </div>
  )
}
