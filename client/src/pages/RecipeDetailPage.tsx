import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { useAppData } from '../lib/appData'
import { useRecipeScale } from '../hooks/useRecipeScale'
import { useChecklist } from '../hooks/useChecklist'
import { StarButton } from '../components/ui/StarButton'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Menu } from '../components/ui/Menu'
import { RecipeCover } from '../components/ui/RecipeCover'
import { useToast } from '../components/ui/Toast'
import { IngredientPanel } from '../components/recipes/IngredientPanel'
import { StepText } from '../components/recipes/StepText'
import { RecipeTile } from '../components/recipes/RecipeTile'
import { PlanPicker } from '../components/recipes/PlanPicker'
import { CollectionPicker } from '../components/recipes/CollectionPicker'
import { formatTime } from '../utils/helpers'
import { uploadPhoto } from '../lib/db'
import { Photo, Recipe } from '../types'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeftIcon, PencilIcon, TrashIcon, PrinterIcon, ClockIcon, FlameIcon, UsersIcon, BarChartIcon, LinkIcon,
  ChefHatIcon, CalendarIcon, BookmarkIcon, ShoppingBagIcon, MoreIcon, ShareIcon, CameraIcon, CheckIcon,
} from '../components/ui/Icons'
import styles from './RecipeDetailPage.module.css'

function related(recipe: Recipe, all: Recipe[]): Recipe[] {
  return all
    .filter((r) => r.id !== recipe.id)
    .map((r) => ({
      r,
      score: (r.category === recipe.category ? 3 : 0) + r.tags.filter((t) => recipe.tags.includes(t)).length + (r.isFavorite ? 0.5 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.r)
}

function hostname(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { recipes, loading, getRecipe, toggleFavorite, deleteRecipe, updateRecipe } = useRecipeContext()
  const { isAdmin } = useAuth()
  const { markViewed, addRecipesToGrocery, forgetRecipe, collections } = useAppData()
  const recipe = getRecipe(id!)
  const scale = useRecipeScale(recipe)
  const gathered = useChecklist(`tt:gathered:${id}`)
  const doneSteps = useChecklist(`tt:steps:${id}`)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (recipe) markViewed(recipe.id) }, [recipe?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Press "c" to start cooking
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey && recipe) navigate(`/recipe/${recipe.id}/cook`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [recipe, navigate])

  const more = useMemo(() => (recipe ? related(recipe, recipes) : []), [recipe, recipes])

  if (!recipe) {
    if (loading) return <div className={styles.loading}><div className="skeleton" style={{ height: 420 }} /></div>
    return (
      <div className={styles.notFound}>
        <p className="eyebrow">404</p>
        <h2>That recipe wandered off.</h2>
        <Button variant="secondary" onClick={() => navigate('/')}>Back to the recipe box</Button>
      </div>
    )
  }

  const r = recipe
  const inCollections = collections.filter((c) => c.recipeIds.includes(r.id))
  const steps = r.instructions.slice().sort((a, b) => a.step - b.step)
  const stepsDone = steps.filter((s) => doneSteps.isChecked(s.id)).length

  async function handleDelete() {
    setDeleting(true)
    await deleteRecipe(r.id)
    forgetRecipe(r.id)
    navigate('/')
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadPhoto(r.id, file)
      const photo: Photo = { id: crypto.randomUUID(), url, dateMade: new Date().toISOString().split('T')[0] }
      await updateRecipe(r.id, { photos: [...r.photos, photo], ...(r.heroImage ? {} : { heroImage: url }) })
      toast(r.heroImage ? 'Photo added' : 'Photo added and set as the cover')
    } catch (err) {
      console.error('Photo upload failed:', err)
      toast('Photo upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: r.title, text: r.description, url })
      else {
        await navigator.clipboard.writeText(url)
        toast('Link copied')
      }
    } catch { /* cancelled */ }
  }

  function addToGrocery() {
    const n = addRecipesToGrocery([{ recipe: r, factor: scale.factor }])
    toast(`Added ${n} ingredients to your list`, { label: 'View list', to: '/grocery' })
  }

  const stats = [
    r.prepTime != null && { icon: <ClockIcon size={16} strokeWidth={1.5} />, label: 'Prep', value: formatTime(r.prepTime) },
    r.cookTime != null && { icon: <FlameIcon size={16} strokeWidth={1.5} />, label: 'Cook', value: formatTime(r.cookTime) },
    r.totalTime != null && { icon: <ClockIcon size={16} strokeWidth={1.5} />, label: 'Total', value: formatTime(r.totalTime) },
    r.servings != null && { icon: <UsersIcon size={16} strokeWidth={1.5} />, label: 'Serves', value: String(r.servings) },
    r.difficulty && { icon: <BarChartIcon size={16} strokeWidth={1.5} />, label: 'Level', value: r.difficulty[0].toUpperCase() + r.difficulty.slice(1) },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[]

  return (
    <article className={styles.page}>
      <div className={`${styles.topBar} no-print`}>
        <Button variant="ghost" size="sm" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} icon={<ArrowLeftIcon size={15} strokeWidth={2} />}>
          Back
        </Button>
        <div className={styles.topActions}>
          <Button variant="ghost" size="sm" onClick={share} icon={<ShareIcon size={15} />} aria-label="Share" />
          <Button variant="ghost" size="sm" onClick={() => window.print()} icon={<PrinterIcon size={15} />} aria-label="Print" />
          <Menu
            trigger={(open) => <Button variant="ghost" size="sm" onClick={open} icon={<MoreIcon size={18} />} aria-label="More actions" />}
            items={isAdmin ? [
              { label: 'Edit recipe', icon: <PencilIcon size={15} />, onClick: () => navigate(`/edit/${r.id}`) },
              { label: uploading ? 'Uploading…' : 'Add a photo', icon: <CameraIcon size={15} />, onClick: () => fileRef.current?.click() },
              { label: 'Print', icon: <PrinterIcon size={15} />, onClick: () => window.print() },
              { label: 'Delete recipe', icon: <TrashIcon size={15} />, onClick: () => setDeleteOpen(true), danger: true },
            ] : [
              { label: 'Print', icon: <PrinterIcon size={15} />, onClick: () => window.print() },
            ]}
          />
        </div>
      </div>

      {/* ── Hero ── */}
      <header className={`${styles.hero} print-recipe`}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>
            <Link to={`/?category=${encodeURIComponent(r.category)}`}>{r.category}</Link>
            {r.createdByTate && <span className={styles.tatePill}><ChefHatIcon size={12} strokeWidth={2} /> Tate's original</span>}
          </p>
          <h1 className={styles.title}>{r.title}</h1>
          {r.description && <p className={styles.description}>{r.description}</p>}

          <div className={styles.proof}>
            {r.sourceUrl ? (
              <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.source}><LinkIcon size={13} strokeWidth={1.75} /> {r.sourceName || hostname(r.sourceUrl)}</a>
            ) : r.sourceName ? <span>From {r.sourceName}</span> : null}
          </div>

          <div className={`${styles.actions} no-print`}>
            <Button size="lg" onClick={() => navigate(`/recipe/${r.id}/cook`)} icon={<ChefHatIcon size={18} strokeWidth={2} />}>
              Start cooking
            </Button>
            {isAdmin && <StarButton isFavorite={r.isFavorite} onToggle={() => toggleFavorite(r.id)} size="lg" />}
            <Button variant="secondary" onClick={() => setPlanOpen(true)} icon={<CalendarIcon size={16} />}>Plan</Button>
            <Button variant="secondary" onClick={() => setCollectionOpen(true)} icon={<BookmarkIcon size={16} />}>
              {inCollections.length ? `Saved · ${inCollections.length}` : 'Save'}
            </Button>
          </div>
        </div>
        <div className={styles.heroCover}>
          <RecipeCover recipe={r} size="lg" eager />
        </div>
      </header>

      {stats.length > 0 && (
        <div className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statValue}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Body ── */}
      <div className={`${styles.body} print-recipe light-surface`}>
        <aside className={styles.ingredients}>
          <div className={styles.sticky}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Ingredients</h2>
              {gathered.checked.size > 0 && (
                <button className={`${styles.reset} no-print`} onClick={gathered.clear}>Reset</button>
              )}
            </div>
            <IngredientPanel
              recipe={r}
              servings={scale.servings}
              factor={scale.factor}
              units={scale.units}
              onServings={scale.setServings}
              onFactor={scale.setFactor}
              onUnits={scale.setUnits}
              isChecked={gathered.isChecked}
              onToggle={gathered.toggle}
            />
            <Button variant="secondary" fullWidth onClick={addToGrocery} icon={<ShoppingBagIcon size={16} />} className="no-print">
              Add to grocery list
            </Button>
          </div>
        </aside>

        <section className={styles.method}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Method</h2>
            {stepsDone > 0 && <span className={styles.progressText}>{stepsDone} of {steps.length} done</span>}
          </div>
          <ol className={styles.steps}>
            {steps.map((s, i) => {
              const done = doneSteps.isChecked(s.id)
              return (
                <li key={s.id} className={`${styles.step} ${done ? styles.stepDone : ''}`}>
                  <button className={styles.stepNum} onClick={() => doneSteps.toggle(s.id)} aria-label={done ? `Mark step ${i + 1} not done` : `Mark step ${i + 1} done`}>
                    {done ? <CheckIcon size={16} strokeWidth={3} /> : i + 1}
                  </button>
                  <p className={styles.stepText}>
                    <StepText text={s.text} stepNumber={i + 1} recipeTitle={r.title} />
                  </p>
                </li>
              )
            })}
          </ol>
          <p className={`${styles.timerHint} no-print`}>Tip: tap any highlighted time to start a timer. Press <kbd>C</kbd> for cook mode.</p>

          {r.tatesTips && (
            <div className={styles.tips}>
              <p className={styles.tipsLabel}>Tate's tips</p>
              {r.tatesTips.split('\n').filter(Boolean).map((line, i) => <p key={i} className={styles.tipsText}>{line}</p>)}
            </div>
          )}

          {r.tags.length > 0 && (
            <div className={styles.tags}>
              {r.tags.map((t) => <Link key={t} to={`/?q=${encodeURIComponent(t)}`} className={styles.tag}>#{t}</Link>)}
            </div>
          )}
        </section>
      </div>

      {more.length > 0 && (
        <section className={`${styles.more} no-print`}>
          <h2 className={styles.sectionTitle}>You might also like</h2>
          <div className={styles.moreGrid}>
            {more.map((m, i) => <RecipeTile key={m.id} recipe={m} index={i} />)}
          </div>
        </section>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
      <PlanPicker recipe={r} isOpen={planOpen} onClose={() => setPlanOpen(false)} />
      <CollectionPicker recipeId={r.id} isOpen={collectionOpen} onClose={() => setCollectionOpen(false)} />

      <Modal
        isOpen={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="Delete this recipe?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>Keep it</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</Button>
          </>
        }
      >
        <p><strong>{r.title}</strong> will be removed from your recipe box, collections and meal plan. This can't be undone.</p>
      </Modal>
    </article>
  )
}
