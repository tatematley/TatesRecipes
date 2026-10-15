import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { RecipeCover } from '../components/ui/RecipeCover'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { CheckIcon, ClockIcon, PlusIcon, SearchIcon, ShoppingBagIcon, XIcon } from '../components/ui/Icons'
import { useRecipeContext } from '../context/RecipeContext'
import { useAppData } from '../lib/appData'
import { aisleFor, namesMatch, normalizeName } from '../utils/quantity'
import { formatTime } from '../utils/helpers'
import { Recipe } from '../types'
import { AppleIcon, BasketIcon, CarrotIcon, EggIcon } from '../components/ui/FoodIcons'
import styles from './PantryPage.module.css'

const LS_KEY = 'tt:pantry'
const LS_STAPLES = 'tt:pantry:staples'

/** Things most kitchens always have: salt, pepper, oil, water, butter, sugar, flour. */
function isStaple(name: string): boolean {
  const n = normalizeName(name)
  if (!n) return false
  const w = n.split(' ')
  const first = w[0]
  const last = w[w.length - 1]
  if (last === 'salt') return true
  if (/\bsalt (and )?pepper\b/.test(n)) return true
  if (last === 'pepper' && (w.length === 1 || ((first === 'black' || first === 'white') && w.length === 2))) return true
  if (last === 'oil' && (w.length === 1 || ['olive', 'vegetable', 'canola', 'neutral', 'cooking'].includes(first))) return true
  if (last === 'water') return true
  if (n === 'butter') return true
  if (last === 'sugar' && (w.length === 1 || ['granulated', 'white', 'cane'].includes(first))) return true
  if (last === 'flour' && (w.length === 1 || n === 'all purpose flour' || n === 'plain flour')) return true
  return false
}

/** Basic seasonings that make poor quick-add suggestions. */
const SKIP_SUGGEST = /\b(salt|pepper|water|oil)\b/

function readChips(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const v = raw ? JSON.parse(raw) : []
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function readStaples(): boolean {
  try { return localStorage.getItem(LS_STAPLES) !== 'off' } catch { return true }
}

interface Match {
  recipe: Recipe
  pct: number
  have: string[]
  missing: string[]
  total: number
}

export function PantryPage() {
  const { recipes, loading } = useRecipeContext()
  const { addGroceryItem, grocery } = useAppData()
  const toast = useToast()
  const [chips, setChips] = useState<string[]>(readChips)
  const [draft, setDraft] = useState('')
  const [ignoreStaples, setIgnoreStaples] = useState<boolean>(readStaples)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(chips)) } catch { /* ignore */ }
  }, [chips])
  useEffect(() => {
    try { localStorage.setItem(LS_STAPLES, ignoreStaples ? 'on' : 'off') } catch { /* ignore */ }
  }, [ignoreStaples])

  function addChip(raw: string) {
    const parts = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    if (!parts.length) return
    setChips((prev) => {
      const next = [...prev]
      for (const p of parts) {
        if (!next.some((c) => normalizeName(c) === normalizeName(p) || c === p)) next.push(p)
      }
      return next
    })
  }
  function removeChip(chip: string) {
    setChips((prev) => prev.filter((c) => c !== chip))
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addChip(draft)
      setDraft('')
    } else if (e.key === 'Backspace' && !draft && chips.length) {
      removeChip(chips[chips.length - 1])
    }
  }

  // Most common ingredients across the collection, for one-tap adding.
  const suggestions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of recipes) {
      const seen = new Set<string>()
      for (const ing of r.ingredients) {
        const n = normalizeName(ing.name)
        if (!n || n.length < 3 || seen.has(n) || SKIP_SUGGEST.test(n) || isStaple(ing.name)) continue
        seen.add(n)
        counts.set(n, (counts.get(n) ?? 0) + 1)
      }
    }
    const all = [...counts.entries()]
    const common = all.filter(([, c]) => c >= 2)
    return (common.length >= 8 ? common : all)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 16)
      .map(([name]) => name)
  }, [recipes])

  const openSuggestions = suggestions.filter((s) => !chips.some((c) => namesMatch(c, s)))

  const matches = useMemo<Match[]>(() => {
    if (!chips.length) return []
    const out: Match[] = []
    for (const recipe of recipes) {
      const have: string[] = []
      const missing: string[] = []
      const seen = new Set<string>()
      let realHits = 0
      for (const ing of recipe.ingredients) {
        const name = ing.name.trim()
        const key = normalizeName(name) || name.toLowerCase()
        if (!name || seen.has(key)) continue
        seen.add(key)
        if (chips.some((c) => namesMatch(c, name))) { have.push(name); realHits++; continue }
        if (ignoreStaples && isStaple(name)) continue
        missing.push(name)
      }
      const total = have.length + missing.length
      if (!total || realHits === 0) continue
      out.push({ recipe, pct: Math.round((have.length / total) * 100), have, missing, total })
    }
    return out.sort((a, b) => b.pct - a.pct || a.missing.length - b.missing.length || a.recipe.title.localeCompare(b.recipe.title))
  }, [recipes, chips, ignoreStaples])

  const ready = matches.filter((m) => m.missing.length === 0)
  const almost = matches.filter((m) => m.missing.length > 0 && m.missing.length <= 2)
  const trip = matches.filter((m) => m.missing.length > 2 && m.pct >= 40)

  function addMissing(m: Match) {
    const onList = new Set(grocery.filter((g) => !g.checked).map((g) => normalizeName(g.name)))
    let n = 0
    for (const name of m.missing) {
      if (onList.has(normalizeName(name))) continue
      addGroceryItem(name, '', aisleFor(name))
      n++
    }
    setAdded((s) => new Set(s).add(m.recipe.id))
    toast(
      n ? `Added ${n} item${n === 1 ? '' : 's'} for ${m.recipe.title}` : 'Already on your grocery list',
      { label: 'View list', to: '/grocery' },
    )
  }

  const sections: { key: string; title: string; note: string; items: Match[]; tone: 'herb' | 'saffron' | 'terracotta' }[] = [
    { key: 'ready', title: 'Ready to cook', note: 'You have everything.', items: ready, tone: 'herb' },
    { key: 'almost', title: 'Almost there', note: 'Just one or two things short.', items: almost, tone: 'saffron' },
    { key: 'trip', title: 'Worth a trip', note: 'A short shopping run away.', items: trip, tone: 'terracotta' },
  ]

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Plan & shop"
        title={<>What can I <em>make</em>?</>}
        subtitle="Tell me what's in your fridge and pantry. I'll find the recipes you can cook right now, and the ones that are only a couple of ingredients away."
      />

      <section className={styles.composer}>
        <div className={styles.inputBox} onClick={() => inputRef.current?.focus()}>
          {chips.map((c) => (
            <span key={c} className={styles.chip}>
              {c}
              <button
                className={styles.chipX}
                onClick={(e) => { e.stopPropagation(); removeChip(c) }}
                aria-label={`Remove ${c}`}
              >
                <XIcon size={12} strokeWidth={2.5} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            className={styles.input}
            value={draft}
            onChange={(e) => {
              const v = e.target.value
              if (v.includes(',')) { addChip(v); setDraft('') } else setDraft(v)
            }}
            onKeyDown={onKeyDown}
            onBlur={() => { if (draft.trim()) { addChip(draft); setDraft('') } }}
            placeholder={chips.length ? 'Add another…' : 'Type an ingredient, e.g. chicken, eggs, lemon…'}
            aria-label="Add an ingredient"
            enterKeyHint="done"
          />
        </div>

        <div className={styles.controls}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={ignoreStaples}
              onChange={(e) => setIgnoreStaples(e.target.checked)}
            />
            <span className={styles.switch} aria-hidden="true" />
            <span>
              <strong>Ignore staples</strong>
              <span className={styles.toggleHint}>Salt, pepper, oil, water, butter, sugar &amp; flour count as on hand</span>
            </span>
          </label>
          {chips.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setChips([])}>Clear all</Button>
          )}
        </div>

        {openSuggestions.length > 0 && (
          <div className={styles.suggest}>
            <p className="eyebrow">Common in your recipes</p>
            <div className={styles.suggestRow}>
              {openSuggestions.map((s) => (
                <button key={s} className={styles.suggestChip} onClick={() => addChip(s)}>
                  <PlusIcon size={12} strokeWidth={2.25} /> {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {chips.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyArt} aria-hidden="true">
            <span><BasketIcon size={24} /></span><span><CarrotIcon size={24} /></span><span><EggIcon size={24} /></span><span><AppleIcon size={24} /></span>
          </div>
          <h2 className={styles.emptyTitle}>Start with what you have</h2>
          <p className={styles.emptyText}>
            Add a few ingredients above, or tap a suggestion. Even two or three is enough to get ideas.
          </p>
        </div>
      ) : loading ? (
        <div className={styles.grid}>
          {[0, 1, 2].map((i) => <div key={i} className={`skeleton ${styles.skel}`} />)}
        </div>
      ) : ready.length + almost.length + trip.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyArt} aria-hidden="true"><span><SearchIcon size={24} /></span></div>
          <h2 className={styles.emptyTitle}>Nothing lines up yet</h2>
          <p className={styles.emptyText}>
            None of your recipes use enough of those. Try adding a couple more ingredients, like an onion, garlic or eggs.
          </p>
        </div>
      ) : (
        <>
          <p className={styles.summary}>
            <strong>{ready.length + almost.length + trip.length}</strong> recipe{ready.length + almost.length + trip.length === 1 ? '' : 's'} from{' '}
            <strong>{chips.length}</strong> ingredient{chips.length === 1 ? '' : 's'}
            {ready.length > 0 && <> · <span className={styles.summaryReady}>{ready.length} ready now</span></>}
          </p>
          {sections.filter((s) => s.items.length > 0).map((s) => (
            <section key={s.key} className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>
                  <span className={`${styles.dot} ${styles[s.tone]}`} />
                  {s.title}
                  <span className={styles.count}>{s.items.length}</span>
                </h2>
                <p className={styles.sectionNote}>{s.note}</p>
              </div>
              <div className={styles.grid}>
                {s.items.map((m, i) => (
                  <MatchCard
                    key={m.recipe.id}
                    match={m}
                    index={i}
                    added={added.has(m.recipe.id)}
                    onAddMissing={() => addMissing(m)}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}

function toneFor(pct: number) {
  return pct === 100 ? styles.ringHerb : pct >= 70 ? styles.ringSaffron : styles.ringTerracotta
}

function MatchRing({ pct }: { pct: number }) {
  const tone = toneFor(pct)
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <div className={`${styles.ring} ${tone}`} aria-label={`${pct}% match`}>
      <svg viewBox="0 0 48 48" width="48" height="48">
        <circle cx="24" cy="24" r={r} className={styles.ringTrack} />
        <circle
          cx="24" cy="24" r={r}
          className={styles.ringFill}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className={styles.ringLabel}>{pct === 100 ? <CheckIcon size={16} strokeWidth={2.75} /> : `${pct}%`}</span>
    </div>
  )
}

function MatchCard({ match, index, added, onAddMissing }: { match: Match; index: number; added: boolean; onAddMissing: () => void }) {
  const { recipe, pct, have, missing, total } = match
  const shown = missing.slice(0, 3)
  const extra = missing.length - shown.length
  return (
    <article className={`${styles.card} ${toneFor(pct)}`} style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}>
      <Link to={`/recipe/${recipe.id}`} className={styles.cardMain}>
        <div className={styles.thumb}><RecipeCover recipe={recipe} size="sm" /></div>
        <div className={styles.cardBody}>
          <p className={styles.cardCat}>{recipe.category}</p>
          <h3 className={styles.cardTitle}>{recipe.title}</h3>
          <p className={styles.cardMeta}>
            {recipe.totalTime ? <><ClockIcon size={12} strokeWidth={1.75} /> {formatTime(recipe.totalTime)} · </> : null}
            {have.length} of {total} ingredients
          </p>
        </div>
        <MatchRing pct={pct} />
      </Link>
      <div className={styles.bar} aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
      {missing.length > 0 ? (
        <div className={styles.cardFoot}>
          <p className={styles.missing}>
            <span className={styles.missingLabel}>Missing:</span>{' '}
            {shown.join(', ')}
            {extra > 0 && <span className={styles.more}> +{extra}</span>}
          </p>
          <button className={`${styles.addBtn} ${added ? styles.addBtnDone : ''}`} onClick={onAddMissing} disabled={added}>
            {added ? <CheckIcon size={13} strokeWidth={2.5} /> : <ShoppingBagIcon size={13} strokeWidth={2} />}
            {added ? 'Added' : 'Add missing'}
          </button>
        </div>
      ) : (
        <div className={styles.cardFoot}>
          <p className={styles.haveAll}>You have everything. Time to cook.</p>
          <Link to={`/recipe/${recipe.id}`} className={styles.cookLink}>Open recipe →</Link>
        </div>
      )}
    </article>
  )
}
