import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { useToast } from '../components/ui/Toast'
import { RecipeTile } from '../components/recipes/RecipeTile'
import { searchRecipes } from '../utils/search'
import styles from './ManagePage.module.css'

type Show = 'all' | 'public' | 'hidden'

/** Admin: every recipe as the main page's photo grid, each with a main-page switch. */
export function ManagePage() {
  const { recipes, loading, updateRecipe } = useRecipeContext()
  const toast = useToast()
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const [show, setShow] = useState<Show>('all')
  const [pending, setPending] = useState<Set<string>>(new Set())

  const publicCount = recipes.filter((r) => r.isPublic).length
  const tiles = useMemo(() => {
    const list = query ? searchRecipes(recipes, query) : recipes
    return list.filter((r) => show === 'all' || (show === 'public') === r.isPublic)
  }, [recipes, query, show])

  async function setPublic(id: string, isPublic: boolean) {
    setPending((p) => new Set(p).add(id))
    try {
      await updateRecipe(id, { isPublic })
    } catch (err) {
      console.error(err)
      toast('Couldn’t save that change')
    } finally {
      setPending((p) => { const n = new Set(p); n.delete(id); return n })
    }
  }

  const tabs: { key: Show; label: string }[] = [
    { key: 'all', label: `All · ${recipes.length}` },
    { key: 'public', label: `On the main page · ${publicCount}` },
    { key: 'hidden', label: `Hidden · ${recipes.length - publicCount}` },
  ]

  return (
    <section className={styles.page}>
      <div className={styles.tabs} role="group" aria-label="Show">
        {tabs.map((t) => (
          <button key={t.key} className={`${styles.tab} ${show === t.key ? styles.tabOn : ''}`} aria-pressed={show === t.key} onClick={() => setShow(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '1 / 1' }} />)}
        </div>
      ) : tiles.length === 0 ? (
        <p className={styles.empty}>No recipes here.</p>
      ) : (
        <div className={styles.grid}>
          {tiles.map((r, i) => (
            <div key={r.id} className={`${styles.cell} ${r.isPublic ? '' : styles.hidden}`}>
              <RecipeTile recipe={r} index={i} tLeft />
              <label className={styles.toggle} title={r.isPublic ? 'On the main page' : 'Hidden'}>
                <input
                  type="checkbox"
                  checked={r.isPublic}
                  disabled={pending.has(r.id)}
                  onChange={(e) => setPublic(r.id, e.target.checked)}
                  aria-label={`Show ${r.title} on the main page`}
                />
                <span className={styles.track} />
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
