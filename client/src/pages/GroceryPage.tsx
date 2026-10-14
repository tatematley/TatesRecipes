import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'
import { RecipePickerModal } from '../components/recipes/RecipePickerModal'
import {
  BookOpenIcon, CalendarIcon, CheckIcon, ChevronDownIcon, CopyIcon, MoreIcon, PlusIcon, TrashIcon, XIcon,
} from '../components/ui/Icons'
import { useAppData } from '../lib/appData'
import { useRecipeContext } from '../context/RecipeContext'
import { AISLES, aisleFor } from '../utils/quantity'
import { GroceryItem, Recipe } from '../types'
import styles from './GroceryPage.module.css'

type GroupMode = 'aisle' | 'recipe'
const MODE_KEY = 'tt:grocery:group'

const AISLE_EMOJI: Record<string, string> = {
  Produce: '🥬', 'Meat & Seafood': '🥩', 'Dairy & Eggs': '🧀', Bakery: '🥖', Pantry: '🫙',
  'Spices & Baking': '🧂', Frozen: '🧊', Drinks: '🍷', Other: '🛒',
}

const UNITS = 'cups?|c|tbsp|tbs|tablespoons?|tsp|teaspoons?|lbs?|pounds?|oz|ounces?|g|grams?|kg|ml|l|cans?|jars?|packages?|pkgs?|bags?|boxes|box|bunch(?:es)?|cloves?|heads?|dozen|bottles?|sticks?|slices?|pieces?|pints?|quarts?|gallons?'
const QUICK_RE = new RegExp(
  `^((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?\\s*[¼½¾⅓⅔⅛]?|[¼½¾⅓⅔⅛])\\s*(?:(${UNITS})\\.?(?:\\s+of)?\\s+|\\s*x\\s+|\\s+)(.+)$`,
  'i',
)

/** "2 lemons" → { amount: "2", name: "lemons" }, "1 lb ground beef" → { amount: "1 lb", ... } */
function parseQuickAdd(text: string): { name: string; amount: string } {
  const t = text.trim().replace(/\s+/g, ' ')
  const m = t.match(QUICK_RE)
  if (!m) return { name: t, amount: '' }
  const amount = [m[1].trim(), m[2]?.toLowerCase()].filter(Boolean).join(' ')
  return { name: m[3].trim(), amount }
}

/** aisleFor treats "ground …" as a spice; ground meat belongs at the butcher. */
function quickAisle(name: string) {
  return aisleFor(name.replace(/\bground\s+(?=(beef|pork|turkey|chicken|lamb|meat|sausage)\b)/i, ''))
}

function readMode(): GroupMode {
  try { return localStorage.getItem(MODE_KEY) === 'recipe' ? 'recipe' : 'aisle' } catch { return 'aisle' }
}

interface Group { key: string; label: string; emoji?: string; recipe?: Recipe; items: GroceryItem[] }

export function GroceryPage() {
  const {
    grocery, addRecipesToGrocery, addGroceryItem, toggleGroceryItem, removeGroceryItem, clearCheckedGrocery, clearGrocery,
  } = useAppData()
  const { getRecipe } = useRecipeContext()
  const toast = useToast()
  const navigate = useNavigate()

  const [mode, setMode] = useState<GroupMode>(readMode)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(true)
  const [quick, setQuick] = useState('')
  /** Items that just got ticked: they show as checked for a beat before sinking into the cart. */
  const [settling, setSettling] = useState<Set<string>>(new Set())
  const [fresh, setFresh] = useState<string | null>(null)
  const timers = useRef<number[]>([])
  const settlingRef = useRef(new Set<string>())
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  useEffect(() => { try { localStorage.setItem(MODE_KEY, mode) } catch { /* ignore */ } }, [mode])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [menuOpen])

  const isChecked = (item: GroceryItem) => item.checked || settling.has(item.id)
  const toBuy = grocery.filter((i) => !i.checked)
  const inCart = grocery.filter((i) => i.checked)
  const doneCount = grocery.filter(isChecked).length
  const pct = grocery.length ? Math.round((doneCount / grocery.length) * 100) : 0
  const leftCount = grocery.length - doneCount

  const groups = useMemo<Group[]>(() => {
    if (mode === 'aisle') {
      const by = new Map<string, GroceryItem[]>()
      for (const item of toBuy) {
        const aisle = (AISLES as readonly string[]).includes(item.aisle) ? item.aisle : 'Other'
        by.set(aisle, [...(by.get(aisle) ?? []), item])
      }
      return AISLES.filter((a) => by.has(a)).map((a) => ({ key: a, label: a, emoji: AISLE_EMOJI[a], items: by.get(a)! }))
    }
    const by = new Map<string, GroceryItem[]>()
    for (const item of toBuy) {
      const ids = item.recipeIds.filter((id) => getRecipe(id))
      for (const id of ids.length ? ids : ['__own']) by.set(id, [...(by.get(id) ?? []), item])
    }
    const out: Group[] = []
    for (const [id, items] of by) {
      if (id === '__own') continue
      const recipe = getRecipe(id)!
      out.push({ key: id, label: recipe.title, recipe, items })
    }
    out.sort((a, b) => a.label.localeCompare(b.label))
    if (by.has('__own')) out.push({ key: '__own', label: 'Added by you', emoji: '✍️', items: by.get('__own')! })
    return out
  }, [mode, toBuy, getRecipe])

  function check(item: GroceryItem) {
    if (item.checked) { toggleGroceryItem(item.id); return }
    if (settling.has(item.id)) {
      // Untick during the settle beat: cancel it.
      settlingRef.current.delete(item.id)
      setSettling((s) => { const n = new Set(s); n.delete(item.id); return n })
      return
    }
    setSettling((s) => new Set(s).add(item.id))
    settlingRef.current.add(item.id)
    const t = window.setTimeout(() => {
      if (!settlingRef.current.has(item.id)) return
      settlingRef.current.delete(item.id)
      toggleGroceryItem(item.id)
      setSettling((s) => { const n = new Set(s); n.delete(item.id); return n })
    }, 650)
    timers.current.push(t)
  }

  function submitQuick(e: React.FormEvent) {
    e.preventDefault()
    const { name, amount } = parseQuickAdd(quick)
    if (!name) return
    const aisle = quickAisle(name)
    addGroceryItem(name, amount, aisle)
    setQuick('')
    setFresh(name.toLowerCase())
    window.setTimeout(() => setFresh(null), 1200)
  }

  function addFromRecipes(ids: string[]) {
    const recipes = ids.map(getRecipe).filter((r): r is Recipe => !!r)
    if (!recipes.length) return
    const n = addRecipesToGrocery(recipes.map((recipe) => ({ recipe })))
    toast(`Added ${n} ingredient${n === 1 ? '' : 's'} from ${recipes.length === 1 ? recipes[0].title : `${recipes.length} recipes`}`)
  }

  async function copyList() {
    const lines: string[] = ['Grocery list', '']
    const by = new Map<string, GroceryItem[]>()
    for (const item of toBuy) {
      const a = (AISLES as readonly string[]).includes(item.aisle) ? item.aisle : 'Other'
      by.set(a, [...(by.get(a) ?? []), item])
    }
    for (const a of AISLES) {
      const items = by.get(a)
      if (!items) continue
      lines.push(a.toUpperCase())
      for (const i of items) lines.push(`☐ ${i.name}${i.amount ? ` (${i.amount})` : ''}`)
      lines.push('')
    }
    const text = lines.join('\n').trim()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      ta.remove()
    }
    toast(`Copied ${toBuy.length} item${toBuy.length === 1 ? '' : 's'} to the clipboard`)
  }

  const subtitle = grocery.length === 0
    ? 'Everything you need for the week, sorted by aisle.'
    : leftCount === 0
      ? 'All done. Everything is in the cart.'
      : <><strong className={styles.count}>{leftCount}</strong> {leftCount === 1 ? 'thing' : 'things'} left to buy{doneCount > 0 ? `, ${doneCount} in the cart` : ''}.</>

  const renderItem = (item: GroceryItem, groupKey: string) => {
    const checked = isChecked(item)
    const sources = item.recipeIds.map(getRecipe).filter((r): r is Recipe => !!r)
    const showSources = mode === 'aisle' ? sources : sources.filter((r) => r.id !== groupKey)
    return (
      <li
        key={`${groupKey}:${item.id}`}
        className={[styles.item, checked ? styles.checked : '', fresh && item.name.toLowerCase() === fresh ? styles.fresh : ''].join(' ')}
      >
        <button
          className={styles.box}
          onClick={() => check(item)}
          role="checkbox"
          aria-checked={checked}
          aria-label={`${checked ? 'Uncheck' : 'Check off'} ${item.name}`}
        >
          <CheckIcon size={15} strokeWidth={3} className={styles.tick} />
        </button>
        <div className={styles.itemText} onClick={() => check(item)}>
          <span className={styles.name}>{item.name}</span>
          {item.amount && <span className={styles.amount}>{item.amount}</span>}
          {showSources.length > 0 && (
            <span className={styles.sources}>
              {showSources.map((r) => (
                <Link key={r.id} to={`/recipe/${r.id}`} className={styles.source} onClick={(e) => e.stopPropagation()}>
                  {mode === 'recipe' ? 'also ' : 'from '}{r.title}
                </Link>
              ))}
            </span>
          )}
        </div>
        <button className={styles.remove} onClick={() => removeGroceryItem(item.id)} aria-label={`Remove ${item.name}`}>
          <XIcon size={15} strokeWidth={2} />
        </button>
      </li>
    )
  }

  const R = 26
  const C = 2 * Math.PI * R

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Plan & shop"
        title={<>Grocery <em>list</em></>}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="secondary" icon={<BookOpenIcon size={16} />} onClick={() => setPickerOpen(true)}>
              Add from recipes
            </Button>
            {grocery.length > 0 && (
              <>
                <Button variant="secondary" icon={<CopyIcon size={16} />} onClick={copyList} className={styles.copyBtn} aria-label="Copy list" disabled={toBuy.length === 0}>
                  Copy list
                </Button>
                <div className={styles.menuWrap} ref={menuRef}>
                  <Button
                    variant="ghost"
                    icon={<MoreIcon size={18} />}
                    aria-label="More options"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((o) => !o)}
                  />
                  {menuOpen && (
                    <div className={styles.menu} role="menu">
                      <button
                        role="menuitem"
                        disabled={inCart.length === 0 && settling.size === 0}
                        onClick={() => { setMenuOpen(false); settling.forEach((id) => toggleGroceryItem(id)); settlingRef.current.clear(); setSettling(new Set()); clearCheckedGrocery(); toast('Cleared checked items') }}
                      >
                        <CheckIcon size={15} /> Clear checked{doneCount ? ` (${doneCount})` : ''}
                      </button>
                      <button role="menuitem" className={styles.danger} onClick={() => { setMenuOpen(false); setConfirmClear(true) }}>
                        <TrashIcon size={15} /> Clear all
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        }
      />

      <form className={styles.quick} onSubmit={submitQuick}>
        <PlusIcon size={18} strokeWidth={2} className={styles.quickIcon} />
        <input
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          placeholder="Add an item, e.g. “2 lemons” or “1 lb ground beef”"
          aria-label="Add an item"
          enterKeyHint="done"
        />
        {quick.trim() && (
          <span className={styles.quickHint}>
            <kbd>↵</kbd> <span>{quickAisle(parseQuickAdd(quick).name)}</span>
          </span>
        )}
      </form>

      {grocery.length === 0 ? (
        <div className={styles.empty}>
          <EmptyState
            emoji="🧺"
            title="Your basket is empty"
            message="Pull ingredients from a few recipes, or plan your week and shop for it in one tap. Type above to add anything else."
            action={{ label: 'Add from recipes', onClick: () => setPickerOpen(true) }}
          />
          <Button variant="ghost" icon={<CalendarIcon size={16} />} onClick={() => navigate('/planner')} className={styles.emptyAlt}>
            Plan the week instead
          </Button>
        </div>
      ) : (
        <>
          <section className={styles.summary}>
            <div className={styles.ring} aria-label={`${pct}% checked off`}>
              <svg viewBox="0 0 64 64" width="64" height="64">
                <circle cx="32" cy="32" r={R} className={styles.ringTrack} />
                <circle
                  cx="32" cy="32" r={R}
                  className={styles.ringFill}
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - pct / 100)}
                />
              </svg>
              <span className={styles.ringPct}>{pct === 100 ? <CheckIcon size={20} strokeWidth={2.75} /> : <span className={styles.pctNum}>{pct}<small>%</small></span>}</span>
            </div>
            <div className={styles.summaryText}>
              <strong>{pct === 100 ? 'Shopping done' : pct === 0 ? 'Ready to shop' : pct >= 50 ? 'Nearly there' : 'Off to a good start'}</strong>
              <span>{doneCount} of {grocery.length} in the cart</span>
            </div>
            <div className={styles.segment} role="radiogroup" aria-label="Group items">
              {(['aisle', 'recipe'] as GroupMode[]).map((m) => (
                <button key={m} role="radio" aria-checked={mode === m} className={mode === m ? styles.segOn : ''} onClick={() => setMode(m)}>
                  By {m}
                </button>
              ))}
            </div>
          </section>

          {groups.length === 0 && (
            <div className={styles.allDone}>
              <span aria-hidden="true">🎉</span>
              <p>Everything's in the cart. Nice work.</p>
            </div>
          )}

          <div className={styles.groups}>
            {groups.map((g, i) => (
              <section key={g.key} className={styles.group} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <header className={styles.groupHead}>
                  {g.recipe ? (
                    <Link to={`/recipe/${g.recipe.id}`} className={styles.groupTitle}>
                      <span className={styles.groupEmoji}>📖</span>{g.label}
                    </Link>
                  ) : (
                    <h2 className={styles.groupTitle}><span className={styles.groupEmoji}>{g.emoji}</span>{g.label}</h2>
                  )}
                  <span className={styles.groupCount}>{g.items.filter((x) => !isChecked(x)).length}</span>
                </header>
                <ul className={styles.list}>{g.items.map((item) => renderItem(item, g.key))}</ul>
              </section>
            ))}
          </div>

          {inCart.length > 0 && (
            <section className={styles.cart}>
              <button className={styles.cartHead} onClick={() => setCartOpen((o) => !o)} aria-expanded={cartOpen}>
                <span className={styles.cartTitle}>
                  <span className={styles.cartBadge}><CheckIcon size={12} strokeWidth={3} /></span>
                  In the cart <span className={styles.groupCount}>{inCart.length}</span>
                </span>
                <ChevronDownIcon size={18} className={`${styles.chev} ${cartOpen ? styles.chevOpen : ''}`} />
              </button>
              {cartOpen && (
                <>
                  <ul className={`${styles.list} ${styles.cartList}`}>{inCart.map((item) => renderItem(item, 'cart'))}</ul>
                  <div className={styles.cartFoot}>
                    <Button variant="ghost" size="sm" icon={<TrashIcon size={14} />} onClick={() => { clearCheckedGrocery(); toast('Cleared checked items') }}>
                      Clear checked
                    </Button>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}

      <RecipePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Add ingredients from recipes"
        multiple
        confirmLabel="Add to list"
        onPick={addFromRecipes}
      />

      <Modal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear the whole list?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>Keep it</Button>
            <Button variant="danger" icon={<TrashIcon size={15} />} onClick={() => { clearGrocery(); settlingRef.current.clear(); setSettling(new Set()); setConfirmClear(false); toast('Grocery list cleared') }}>
              Clear all {grocery.length}
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>This removes all {grocery.length} items, including ones still to buy. It can't be undone.</p>
      </Modal>
    </div>
  )
}
