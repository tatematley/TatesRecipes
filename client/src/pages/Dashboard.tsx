import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { useAppData, todayISO } from '../lib/appData'
import { isDemo } from '../lib/supabase'
import { RecipeLibrary } from '../components/recipes/RecipeLibrary'
import { RecipeCover } from '../components/ui/RecipeCover'
import { Button } from '../components/ui/Button'
import { ArrowRightIcon, ChefHatIcon, ClockIcon, PlusIcon, ShuffleIcon, CalendarIcon, SparkleIcon } from '../components/ui/Icons'
import { formatTime, greeting } from '../utils/helpers'
import { Recipe } from '../types'
import styles from './Dashboard.module.css'

/** A stable-ish "tonight" pick: today's plan first, then weighted random. */
function pickTonight(recipes: Recipe[], seed: number): Recipe | undefined {
  const mains = recipes.filter((r) => ['Dinner', 'Soups', 'Salads', 'Lunch'].includes(r.category))
  const pool = mains.length ? mains : recipes
  if (!pool.length) return undefined
  const weighted = pool.flatMap((r) => (r.isFavorite ? [r, r] : [r]))
  return weighted[seed % weighted.length]
}

export function Dashboard() {
  const { recipes, loading, error } = useRecipeContext()
  const { plan, recent, cookLog } = useAppData()
  const navigate = useNavigate()
  const [seed, setSeed] = useState(() => new Date().getDate() * 7 + new Date().getMonth())

  const today = todayISO()
  const plannedToday = plan.filter((p) => p.date === today).map((p) => recipes.find((r) => r.id === p.recipeId)).filter(Boolean) as Recipe[]
  const planned = plannedToday[0]
  const pick = planned ?? pickTonight(recipes, seed)

  const recentRecipes = useMemo(
    () => recent.map((id) => recipes.find((r) => r.id === id)).filter(Boolean).slice(0, 8) as Recipe[],
    [recent, recipes],
  )

  const madeThisMonth = cookLog.filter((c) => c.date.slice(0, 7) === today.slice(0, 7)).length
  const favorites = recipes.filter((r) => r.isFavorite).length
  const tates = recipes.filter((r) => r.createdByTate).length

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className="eyebrow">{greeting()}, Tate</p>
          <h1 className={styles.headline}>
            What are we <em>cooking</em> tonight?
          </h1>
          <div className={styles.stats}>
            <Stat value={recipes.length} label="recipes" />
            <Stat value={favorites} label="favorites" />
            <Stat value={tates} label="your own" />
            <Stat value={madeThisMonth} label="cooked this month" />
          </div>
        </div>

        {pick && !loading && (
          <article className={styles.pick}>
            <Link to={`/recipe/${pick.id}`} className={styles.pickCover} aria-label={pick.title}>
              <RecipeCover recipe={pick} size="md" eager />
            </Link>
            <div className={styles.pickBody}>
              <p className={styles.pickLabel}>
                {planned ? <><CalendarIcon size={13} strokeWidth={2} /> On the plan for tonight</> : <><ShuffleIcon size={13} strokeWidth={2} /> Tonight's pick</>}
              </p>
              <Link to={`/recipe/${pick.id}`} className={styles.pickTitle}>{pick.title}</Link>
              {pick.description && <p className={styles.pickDesc}>{pick.description}</p>}
              <p className={styles.pickMeta}>
                {pick.totalTime ? <span><ClockIcon size={13} strokeWidth={1.75} /> {formatTime(pick.totalTime)}</span> : null}
                {pick.createdByTate && <span><ChefHatIcon size={13} strokeWidth={1.75} /> Tate's recipe</span>}
              </p>
              <div className={styles.pickActions}>
                <Button size="sm" onClick={() => navigate(`/recipe/${pick.id}/cook`)} icon={<ChefHatIcon size={14} strokeWidth={2} />}>
                  Start cooking
                </Button>
                {!planned && (
                  <Button size="sm" variant="secondary" onClick={() => setSeed((s) => s + 1 + Math.floor(Math.random() * 5))} icon={<ShuffleIcon size={14} />}>
                    Shuffle
                  </Button>
                )}
              </div>
            </div>
          </article>
        )}
      </section>

      {error && (
        <div className={styles.errorBanner}>
          <strong>Couldn't reach your recipes.</strong> {error}. Check the Supabase settings in <code>client/.env.local</code>.
        </div>
      )}
      {isDemo && !loading && (
        <div className={styles.demoBanner}>
          <span>You're looking at sample recipes. Add your Supabase keys to <code>client/.env.local</code> to load your real recipe box.</span>
        </div>
      )}

      {recentRecipes.length > 0 && (
        <section className={styles.shelf}>
          <div className={styles.shelfHead}>
            <h2 className={styles.shelfTitle}>Jump back in</h2>
          </div>
          <div className={styles.shelfRow}>
            {recentRecipes.map((r) => (
              <Link key={r.id} to={`/recipe/${r.id}`} className={styles.mini}>
                <span className={styles.miniCover}><RecipeCover recipe={r} size="sm" /></span>
                <span className={styles.miniTitle}>{r.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.librarySection}>
        <div className={styles.shelfHead}>
          <h2 className={styles.shelfTitle}>The recipe box</h2>
          <Button size="sm" variant="ghost" onClick={() => navigate('/add')} icon={<PlusIcon size={14} strokeWidth={2} />}>
            Add recipe
          </Button>
        </div>
        <RecipeLibrary
          recipes={recipes}
          loading={loading}
          emptyTitle="Your recipe box is empty"
          emptyMessage="Add your first recipe, or import one from a link or a photo of a cookbook page."
        />
      </section>

      <Link to="/assistant" className={styles.askBar}>
        <span className={styles.askText}><SparkleIcon size={16} /> Not sure what to make? Ask the kitchen assistant</span>
        <ArrowRightIcon size={16} />
      </Link>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
