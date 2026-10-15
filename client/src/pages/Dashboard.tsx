import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { useAppData } from '../lib/appData'
import { RecipeLibrary } from '../components/recipes/RecipeLibrary'
import { RecipeCard } from '../components/recipes/RecipeCard'
import { RecipeCover } from '../components/ui/RecipeCover'
import { ArrowRightIcon, ChefHatIcon, ClockIcon, HeartIcon } from '../components/ui/Icons'
import { Recipe } from '../types'
import styles from './Dashboard.module.css'

export function Dashboard() {
  const { recipes, loading, error } = useRecipeContext()
  const { recent } = useAppData()

  const recentRecipes = useMemo(
    () => recent.map((id) => recipes.find((r) => r.id === id)).filter(Boolean).slice(0, 6) as Recipe[],
    [recent, recipes],
  )
  const originals = recipes.filter((r) => r.createdByTate)
  const favorites = recipes.filter((r) => r.isFavorite)
  const quick = recipes.filter((r) => r.totalTime != null && r.totalTime > 0 && r.totalTime <= 30)

  const browse = (
    <div className={styles.sections}>
      {recentRecipes.length > 0 && (
        <section className={styles.recent}>
          <h2 className={styles.kicker}>Pick up where you left off</h2>
          <div className={styles.recentRow}>
            {recentRecipes.map((r) => (
              <Link key={r.id} to={`/recipe/${r.id}`} className={styles.recentItem}>
                <span className={styles.recentCover}><RecipeCover recipe={r} size="sm" /></span>
                <span className={styles.recentTitle}>{r.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {originals.length > 0 && (
        <Shelf
          tone="deep"
          icon={<ChefHatIcon size={18} strokeWidth={1.75} />}
          title="Tate's Originals"
          subtitle="Written and tested in my own kitchen."
          to="/created"
          recipes={originals}
        />
      )}

      {favorites.length > 0 && (
        <Shelf
          tone="sky"
          icon={<HeartIcon size={18} strokeWidth={1.75} />}
          title="Favorites"
          subtitle="The ones worth making again and again."
          to="/favorites"
          recipes={favorites}
        />
      )}

      {quick.length > 0 && (
        <Shelf
          tone="plain"
          icon={<ClockIcon size={18} strokeWidth={1.75} />}
          title="Quick weeknights"
          subtitle="On the table in 30 minutes or less."
          to="/collections/smart-quick"
          recipes={quick}
        />
      )}
    </div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Recipes</h1>
        {!loading && <p className={styles.subtitle}>{recipes.length} recipes, made by Tate and saved from everywhere else.</p>}
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <strong>Couldn't reach your recipes.</strong> {error}. Check the Supabase settings in <code>client/.env.local</code>.
        </div>
      )}

      <RecipeLibrary
        recipes={recipes}
        loading={loading}
        browse={browse}
        allTitle="All recipes"
        emptyTitle="Your recipe box is empty"
        emptyMessage="Add your first recipe, or import one from a link or a photo of a cookbook page."
      />
    </div>
  )
}

function Shelf({ tone, icon, title, subtitle, to, recipes }: {
  tone: 'deep' | 'sky' | 'plain'
  icon: React.ReactNode
  title: string
  subtitle: string
  to: string
  recipes: Recipe[]
}) {
  return (
    <section className={`${styles.shelf} ${styles[tone]}`}>
      <div className={styles.shelfHead}>
        <div className={styles.shelfText}>
          <span className={styles.shelfIcon}>{icon}</span>
          <div>
            <h2 className={styles.shelfTitle}>{title}</h2>
            <p className={styles.shelfSub}>{subtitle}</p>
          </div>
        </div>
        <Link to={to} className={styles.seeAll}>
          See all {recipes.length} <ArrowRightIcon size={15} strokeWidth={2} />
        </Link>
      </div>
      <div className={styles.shelfRow}>
        {recipes.slice(0, 10).map((r, i) => (
          <div key={r.id} className={styles.shelfItem}>
            <RecipeCard recipe={r} index={i} />
          </div>
        ))}
      </div>
    </section>
  )
}
