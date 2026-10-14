import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import styles from './CommandPalette.module.css'
import { useRecipeContext } from '../../context/RecipeContext'
import { NAV_GROUPS } from './nav'
import { RecipeCover } from '../ui/RecipeCover'
import { PlusIcon, SearchIcon, ShuffleIcon, MoonIcon, ArrowRightIcon } from '../ui/Icons'
import { useTheme } from '../../hooks/useTheme'
import { searchRecipes } from '../../utils/search'
import { formatTime } from '../../utils/helpers'

interface Item {
  id: string
  kind: 'recipe' | 'action'
  label: string
  hint?: string
  run: () => void
  render?: () => React.ReactNode
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { recipes } = useRecipeContext()
  const { toggle } = useTheme()

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => { navigate(to); onClose() }
    const recipeItems: Item[] = searchRecipes(recipes, query)
      .slice(0, query ? 8 : 5)
      .map((r) => ({
        id: r.id,
        kind: 'recipe',
        label: r.title,
        hint: [r.category, r.totalTime ? formatTime(r.totalTime) : ''].filter(Boolean).join(' · '),
        run: go(`/recipe/${r.id}`),
        render: () => (
          <span className={styles.thumb}><RecipeCover recipe={r} size="sm" /></span>
        ),
      }))

    const actions: Item[] = [
      { id: 'a-new', kind: 'action', label: 'Add a new recipe', run: go('/add'), render: () => <PlusIcon size={16} /> },
      {
        id: 'a-random', kind: 'action', label: 'Surprise me', hint: 'Open a random recipe',
        run: () => {
          if (!recipes.length) return
          const r = recipes[Math.floor(Math.random() * recipes.length)]
          navigate(`/recipe/${r.id}`)
          onClose()
        },
        render: () => <ShuffleIcon size={16} />,
      },
      { id: 'a-theme', kind: 'action', label: 'Toggle dark mode', run: () => { toggle(); onClose() }, render: () => <MoonIcon size={16} /> },
      ...NAV_GROUPS.flatMap((g) => g.items).map(({ to, label, Icon }) => ({
        id: `nav-${to}`, kind: 'action' as const, label: `Go to ${label}`, run: go(to), render: () => <Icon size={16} />,
      })),
    ]
    const q = query.trim().toLowerCase()
    const filteredActions = q ? actions.filter((a) => a.label.toLowerCase().includes(q)) : actions
    if (q && q.length > 2) {
      filteredActions.push({
        id: 'a-ask', kind: 'action', label: `Ask the assistant: “${query.trim()}”`,
        run: () => { navigate(`/assistant?q=${encodeURIComponent(query.trim())}`); onClose() },
        render: () => <ArrowRightIcon size={16} />,
      })
    }
    return [...recipeItems, ...filteredActions]
  }, [recipes, query, navigate, onClose, toggle])

  useEffect(() => { setActive(0) }, [query])

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); items[active]?.run() }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  const recipeCount = items.filter((i) => i.kind === 'recipe').length

  return createPortal(
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.panel} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
        <div className={styles.inputRow}>
          <SearchIcon size={18} strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search recipes, ingredients, or jump anywhere…"
            className={styles.input}
            aria-label="Search"
          />
          <kbd className={styles.esc}>esc</kbd>
        </div>
        <div className={styles.list} ref={listRef}>
          {items.length === 0 && <p className={styles.empty}>Nothing matches “{query}”.</p>}
          {items.map((item, i) => (
            <div key={item.id}>
              {i === 0 && recipeCount > 0 && <p className={styles.section}>{query ? 'Recipes' : 'Recent & favorites'}</p>}
              {i === recipeCount && <p className={styles.section}>Actions</p>}
              <button
                data-index={i}
                className={`${styles.item} ${i === active ? styles.itemActive : ''}`}
                onMouseMove={() => setActive(i)}
                onClick={item.run}
              >
                <span className={item.kind === 'action' ? styles.actionIcon : undefined}>{item.render?.()}</span>
                <span className={styles.label}>{item.label}</span>
                {item.hint && <span className={styles.hint}>{item.hint}</span>}
              </button>
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <span><kbd>↑</kbd><kbd>↓</kbd> to move</span>
          <span><kbd>↵</kbd> to open</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
