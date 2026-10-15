import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { RecipeCover } from '../components/ui/RecipeCover'
import { useToast } from '../components/ui/Toast'
import { RecipePickerModal } from '../components/recipes/RecipePickerModal'
import {
  ChevronLeftIcon, ChevronRightIcon, ClockIcon, HeartIcon, PlusIcon, ShoppingBagIcon, ShuffleIcon, SparkleIcon, XIcon,
} from '../components/ui/Icons'
import { useAppData, toISODate, todayISO } from '../lib/appData'
import { useRecipeContext } from '../context/RecipeContext'
import { formatTime } from '../utils/helpers'
import { PlanEntry, Recipe } from '../types'
import { AppleIcon, CoffeeIcon, SandwichIcon, UtensilsIcon } from '../components/ui/FoodIcons'
import styles from './PlannerPage.module.css'

type Meal = PlanEntry['meal']
const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const MEAL_ORDER: Record<Meal, number> = { Breakfast: 0, Lunch: 1, Dinner: 2, Snack: 3 }
const MEAL_ICON: Record<Meal, typeof CoffeeIcon> = { Breakfast: CoffeeIcon, Lunch: SandwichIcon, Dinner: UtensilsIcon, Snack: AppleIcon }

/** How well each category works as a dinner when filling the week (0 = never suggest). */
const DINNER_FIT: Record<string, number> = {
  Dinner: 1, 'Family Favorites': 1, Soups: 0.8, Salads: 0.6, Lunch: 0.4, 'Holiday Recipes': 0.15,
  Sides: 0.08, Appetizers: 0.08,
}

const fromISO = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function mondayOf(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return addDays(x, -((x.getDay() + 6) % 7))
}
const recipeMinutes = (r: Recipe) => r.totalTime ?? (((r.prepTime ?? 0) + (r.cookTime ?? 0)) || null)

function rangeLabel(start: Date, end: Date) {
  const md = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (start.getFullYear() !== end.getFullYear()) return `${md(start)}, ${start.getFullYear()} – ${md(end)}, ${end.getFullYear()}`
  const tail = start.getMonth() === end.getMonth() ? String(end.getDate()) : md(end)
  return `${md(start)} – ${tail}, ${end.getFullYear()}`
}

/** Weighted pick without replacement. */
function weightedPick<T>(pool: { item: T; w: number }[]): T | null {
  const total = pool.reduce((s, p) => s + p.w, 0)
  if (!pool.length || total <= 0) return null
  let r = Math.random() * total
  for (const p of pool) { r -= p.w; if (r <= 0) return p.item }
  return pool[pool.length - 1].item
}

interface Suggestion { date: string; recipeId: string | null }

export function PlannerPage() {
  const { plan, addToPlan, removeFromPlan, movePlanEntry, addRecipesToGrocery } = useAppData()
  const { recipes, getRecipe } = useRecipeContext()
  const toast = useToast()
  const navigate = useNavigate()

  const [offset, setOffset] = useState(0)
  const [addDate, setAddDate] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingRecipe, setPendingRecipe] = useState<Recipe | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overDate, setOverDate] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)

  const today = todayISO()
  const weekStart = useMemo(() => addDays(mondayOf(new Date()), offset * 7), [offset])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    return { date: toISODate(d), d }
  }), [weekStart])
  const weekEntries = useMemo(() => {
    const dates = new Set(days.map((x) => x.date))
    return plan.filter((e) => dates.has(e.date) && getRecipe(e.recipeId))
  }, [plan, days, getRecipe])
  const byDate = useMemo(() => {
    const m = new Map<string, PlanEntry[]>()
    for (const e of weekEntries) m.set(e.date, [...(m.get(e.date) ?? []), e])
    for (const list of m.values()) list.sort((a, b) => MEAL_ORDER[a.meal] - MEAL_ORDER[b.meal])
    return m
  }, [weekEntries])

  const totalMinutes = weekEntries.reduce((s, e) => s + (recipeMinutes(getRecipe(e.recipeId)!) ?? 0), 0)
  const uniqueRecipes = new Set(weekEntries.map((e) => e.recipeId)).size
  const daysCovered = new Set(weekEntries.map((e) => e.date)).size

  const isThisWeek = offset === 0
  const weekTitle = offset === 0 ? 'This week' : offset === 1 ? 'Next week' : offset === -1 ? 'Last week' : rangeLabel(days[0].d, days[6].d)

  // ── Adding ──────────────────────────────────────
  function startAdd(date: string) {
    setAddDate(date)
    setPickerOpen(true)
  }
  function pickRecipe(ids: string[]) {
    const r = getRecipe(ids[0])
    if (r) setPendingRecipe(r)
  }
  function confirmMeal(meal: Meal) {
    if (!pendingRecipe || !addDate) return
    addToPlan({ date: addDate, recipeId: pendingRecipe.id, meal })
    const day = fromISO(addDate).toLocaleDateString(undefined, { weekday: 'long' })
    toast(`${pendingRecipe.title} added to ${day}'s ${meal.toLowerCase()}`)
    setPendingRecipe(null)
    setAddDate(null)
  }

  // ── Drag & drop ─────────────────────────────────
  function onDrop(e: React.DragEvent, date: string) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragId
    setOverDate(null)
    setDragId(null)
    if (!id) return
    const entry = plan.find((x) => x.id === id)
    if (entry && entry.date !== date) movePlanEntry(id, date)
  }

  // ── Shop ────────────────────────────────────────
  function shopWeek(extra: PlanEntry[] = []) {
    const items = [...weekEntries, ...extra].map((e) => {
      const recipe = getRecipe(e.recipeId)!
      const factor = e.servings && recipe.servings ? e.servings / recipe.servings : 1
      return { recipe, factor }
    })
    if (!items.length) return
    const n = addRecipesToGrocery(items)
    toast(`Added ${n} ingredient${n === 1 ? '' : 's'} for ${items.length} meal${items.length === 1 ? '' : 's'}`, { label: 'View list', to: '/grocery' })
  }

  // ── Fill my week ────────────────────────────────
  const emptyDinnerDates = days
    .filter(({ date }) => date >= today || offset > 0)
    .filter(({ date }) => !(byDate.get(date) ?? []).some((e) => e.meal === 'Dinner'))
    .map((x) => x.date)

  function suggestFor(dates: string[], keep: Suggestion[] = []): Suggestion[] {
    const used = new Set<string>([...weekEntries.map((e) => e.recipeId), ...keep.map((k) => k.recipeId!).filter(Boolean)])
    return dates.map((date) => {
      const dow = fromISO(date).getDay()
      const weekday = dow >= 1 && dow <= 5
      const pool = recipes
        .filter((r) => !used.has(r.id) && (DINNER_FIT[r.category] ?? 0) > 0)
        .map((r) => {
          const mins = recipeMinutes(r)
          let w = DINNER_FIT[r.category]
          if (r.tags.includes('Weeknight Dinner') && weekday) w *= 2
          if (r.isFavorite) w *= 3
          if (weekday && mins != null && mins <= 40) w *= 2.5
          if (weekday && mins != null && mins > 90) w *= 0.35
          if (!weekday && mins != null && mins > 60) w *= 1.6
          return { item: r, w }
        })
      const pick = weightedPick(pool)
      if (pick) used.add(pick.id)
      return { date, recipeId: pick?.id ?? null }
    })
  }

  function openFill() {
    setSuggestions(suggestFor(emptyDinnerDates))
  }
  function reshuffleAll() {
    if (!suggestions) return
    setSuggestions(suggestFor(suggestions.map((s) => s.date)))
  }
  function reshuffleOne(date: string) {
    if (!suggestions) return
    const others = suggestions.filter((s) => s.date !== date)
    const [fresh] = suggestFor([date], [...others, ...suggestions.filter((s) => s.date === date)])
    setSuggestions(suggestions.map((s) => (s.date === date ? (fresh.recipeId ? fresh : s) : s)))
  }
  function skipOne(date: string) {
    setSuggestions((s) => s && s.filter((x) => x.date !== date))
  }
  function acceptFill() {
    const chosen = (suggestions ?? []).filter((s) => s.recipeId)
    for (const s of chosen) addToPlan({ date: s.date, recipeId: s.recipeId!, meal: 'Dinner' })
    setSuggestions(null)
    if (!chosen.length) return
    const added: PlanEntry[] = chosen.map((s) => ({ id: s.date, date: s.date, recipeId: s.recipeId!, meal: 'Dinner' }))
    toast(`Planned ${chosen.length} dinner${chosen.length === 1 ? '' : 's'}`, { label: 'Shop the week', onClick: () => shopWeek(added) })
  }

  const subtitle = weekEntries.length
    ? `${weekEntries.length} meal${weekEntries.length === 1 ? '' : 's'} across ${daysCovered} day${daysCovered === 1 ? '' : 's'}. Drag to rearrange.`
    : 'Plan a few dinners, then shop for all of them in one go.'

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Plan the week"
        title={<>Meal <em>planner</em></>}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="secondary" icon={<SparkleIcon size={16} />} onClick={openFill} disabled={!emptyDinnerDates.length || recipes.length === 0}>
              Fill my week
            </Button>
            <Button icon={<ShoppingBagIcon size={16} />} onClick={() => shopWeek()} disabled={!weekEntries.length}>
              Shop for this week
            </Button>
          </>
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.weekNav}>
          <Button variant="secondary" size="sm" icon={<ChevronLeftIcon size={16} />} aria-label="Previous week" onClick={() => setOffset((o) => o - 1)} />
          <div className={styles.weekLabel}>
            <strong>{weekTitle}</strong>
            <span>{rangeLabel(days[0].d, days[6].d)}</span>
          </div>
          <Button variant="secondary" size="sm" icon={<ChevronRightIcon size={16} />} aria-label="Next week" onClick={() => setOffset((o) => o + 1)} />
          {!isThisWeek && (
            <Button variant="ghost" size="sm" onClick={() => setOffset(0)} className={styles.todayBtn}>This week</Button>
          )}
        </div>
        <dl className={styles.stats}>
          <div><dt>Meals</dt><dd>{weekEntries.length}</dd></div>
          <div><dt>Recipes</dt><dd>{uniqueRecipes}</dd></div>
          <div><dt>Cook time</dt><dd>{totalMinutes ? formatTime(totalMinutes) : '—'}</dd></div>
        </dl>
      </div>

      <div className={styles.week} key={offset}>
        {days.map(({ date, d }, i) => {
          const entries = byDate.get(date) ?? []
          const isToday = date === today
          const isPast = date < today
          return (
            <section
              key={date}
              className={[styles.day, isToday ? styles.today : '', isPast ? styles.past : '', overDate === date ? styles.over : ''].join(' ')}
              style={{ animationDelay: `${i * 35}ms` }}
              onDragOver={(e) => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (overDate !== date) setOverDate(date) } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverDate((o) => (o === date ? null : o)) }}
              onDrop={(e) => onDrop(e, date)}
              aria-label={d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            >
              <header className={styles.dayHead}>
                <div className={styles.dayName}>
                  <span className={styles.dow}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <span className={styles.dnum}>{d.getDate()}</span>
                  {isToday && <span className={styles.todayPill}>Today</span>}
                </div>
                <button className={styles.addBtn} onClick={() => startAdd(date)} aria-label={`Add a meal on ${d.toLocaleDateString(undefined, { weekday: 'long' })}`}>
                  <PlusIcon size={14} strokeWidth={2.25} /><span>Add</span>
                </button>
              </header>

              <div className={styles.entries}>
                {entries.map((e) => {
                  const r = getRecipe(e.recipeId)!
                  const mins = recipeMinutes(r)
                  return (
                    <article
                      key={e.id}
                      className={[styles.entry, dragId === e.id ? styles.dragging : ''].join(' ')}
                      draggable
                      onDragStart={(ev) => { ev.dataTransfer.setData('text/plain', e.id); ev.dataTransfer.effectAllowed = 'move'; setDragId(e.id) }}
                      onDragEnd={() => { setDragId(null); setOverDate(null) }}
                      onClick={() => navigate(`/recipe/${r.id}`)}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(ev) => { if (ev.key === 'Enter') navigate(`/recipe/${r.id}`) }}
                    >
                      <span className={styles.thumb}><RecipeCover recipe={r} size="sm" /></span>
                      <span className={styles.entryText}>
                        <span className={styles.meal} data-meal={e.meal}>{e.meal}</span>
                        <span className={styles.entryTitle}>{r.title}</span>
                        {mins ? <span className={styles.entryMeta}><ClockIcon size={11} strokeWidth={2} />{formatTime(mins)}</span> : null}
                      </span>
                      <button
                        className={styles.removeBtn}
                        onClick={(ev) => { ev.stopPropagation(); removeFromPlan(e.id); toast(`Removed ${r.title}`, { label: 'Undo', onClick: () => addToPlan({ date: e.date, recipeId: e.recipeId, meal: e.meal, servings: e.servings }) }) }}
                        aria-label={`Remove ${r.title}`}
                      >
                        <XIcon size={13} strokeWidth={2.25} />
                      </button>
                    </article>
                  )
                })}
                {entries.length === 0 && (
                  <button className={styles.emptySlot} onClick={() => startAdd(date)}>
                    {overDate === date ? 'Drop here' : isPast ? 'Nothing planned' : 'Plan a meal'}
                  </button>
                )}
              </div>
            </section>
          )
        })}
      </div>

      {/* Step 1: pick a recipe */}
      <RecipePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={addDate ? `Plan for ${fromISO(addDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}` : 'Pick a recipe'}
        onPick={pickRecipe}
      />

      {/* Step 2: which meal */}
      <Modal
        isOpen={!!pendingRecipe}
        onClose={() => { setPendingRecipe(null); setAddDate(null) }}
        title="Which meal?"
        size="sm"
      >
        {pendingRecipe && (
          <div className={styles.mealStep}>
            <div className={styles.mealRecipe}>
              <span className={styles.mealThumb}><RecipeCover recipe={pendingRecipe} size="sm" /></span>
              <div>
                <strong>{pendingRecipe.title}</strong>
                <span>{addDate && fromISO(addDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
            <div className={styles.mealGrid}>
              {MEALS.map((m) => (
                <button key={m} className={`${styles.mealChoice} ${m === 'Dinner' ? styles.mealDefault : ''}`} onClick={() => confirmMeal(m)} autoFocus={m === 'Dinner'}>
                  {(() => { const I = MEAL_ICON[m]; return <I size={18} /> })()}{m}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Fill my week preview */}
      <Modal
        isOpen={!!suggestions}
        onClose={() => setSuggestions(null)}
        title="Fill my week"
        footer={
          <>
            <Button variant="ghost" icon={<ShuffleIcon size={15} />} onClick={reshuffleAll} className={styles.shuffleAll}>Reshuffle</Button>
            <Button variant="ghost" onClick={() => setSuggestions(null)}>Cancel</Button>
            <Button onClick={acceptFill} disabled={!suggestions?.some((s) => s.recipeId)}>
              Plan {suggestions?.filter((s) => s.recipeId).length ?? 0} dinner{suggestions?.filter((s) => s.recipeId).length === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <p className={styles.fillIntro}>Ideas for your empty dinner nights, leaning on favorites, with quicker recipes on weeknights.</p>
        <ul className={styles.fillList}>
          {suggestions?.map((s) => {
            const r = s.recipeId ? getRecipe(s.recipeId) : null
            const d = fromISO(s.date)
            const mins = r ? recipeMinutes(r) : null
            return (
              <li key={`${s.date}:${s.recipeId}`} className={styles.fillRow}>
                <span className={styles.fillDay}>
                  <span>{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <strong>{d.getDate()}</strong>
                </span>
                {r ? (
                  <>
                    <span className={styles.fillThumb}><RecipeCover recipe={r} size="sm" /></span>
                    <span className={styles.fillText}>
                      <strong>{r.title}</strong>
                      <span>
                        {r.isFavorite && <HeartIcon size={11} strokeWidth={2.25} className={styles.fav} />}
                        {[r.category, mins ? formatTime(mins) : ''].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </>
                ) : (
                  <span className={styles.fillText}><span>No more recipes to suggest</span></span>
                )}
                <span className={styles.fillActions}>
                  <Button variant="ghost" size="sm" icon={<ShuffleIcon size={15} />} aria-label="Suggest another" onClick={() => reshuffleOne(s.date)} />
                  <Button variant="ghost" size="sm" icon={<XIcon size={15} />} aria-label="Skip this night" onClick={() => skipOne(s.date)} />
                </span>
              </li>
            )
          })}
          {suggestions?.length === 0 && <li className={styles.fillEmpty}>Nothing left to fill.</li>}
        </ul>
      </Modal>
    </div>
  )
}
