import { useSearchParams } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { RecipeLibrary } from '../components/recipes/RecipeLibrary'
import { HeartIcon } from '../components/ui/Icons'
import styles from './Dashboard.module.css'

type View = 'favorites' | 'tates'

const EMPTY: Record<View | 'all', { title: string; message: string }> = {
  all: { title: 'Your recipe box is empty', message: 'Tap + to add your first recipe, or import one from a link or a photo of a cookbook page.' },
  favorites: { title: 'No favorites yet', message: 'Tap the heart on any recipe and it will show up here.' },
  tates: { title: "No originals yet", message: 'Mark a recipe as "Created by Tate" when you add it and it will show up here.' },
}

export function Dashboard() {
  const { recipes, loading, error } = useRecipeContext()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') as View | null

  function toggleView(v: View) {
    const next = new URLSearchParams(params)
    if (view === v) next.delete('view')
    else next.set('view', v)
    setParams(next, { replace: true })
  }

  // The main page is the public one, even for the admin
  const published = recipes.filter((r) => r.isPublic)
  const list = view === 'favorites' ? published.filter((r) => r.isFavorite)
    : view === 'tates' ? published.filter((r) => r.createdByTate)
    : published
  const empty = EMPTY[view ?? 'all']

  const chips = (
    <div className={styles.chips} role="group" aria-label="Show">
      <button className={`${styles.chip} ${view === 'favorites' ? styles.chipOn : ''}`} aria-pressed={view === 'favorites'} onClick={() => toggleView('favorites')}>
        <HeartIcon size={15} strokeWidth={2} /> Favorites
      </button>
      <button className={`${styles.chip} ${view === 'tates' ? styles.chipOn : ''}`} aria-pressed={view === 'tates'} onClick={() => toggleView('tates')}>
        <span className={styles.chipT}>T</span> Tate's Originals
      </button>
    </div>
  )

  return (
    <div className={styles.page}>
      {error && (
        <div className={styles.errorBanner}>
          <strong>Couldn't reach your recipes.</strong> {error}. Check the Supabase settings in <code>client/.env.local</code>.
        </div>
      )}

      <RecipeLibrary
        recipes={list}
        loading={loading}
        chips={chips}
        emptyTitle={empty.title}
        emptyMessage={empty.message}
      />
    </div>
  )
}
