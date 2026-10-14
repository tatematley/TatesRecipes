import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { RecipeCover } from '../components/ui/RecipeCover'
import { PlusIcon, ArrowRightIcon } from '../components/ui/Icons'
import { CollectionFormModal } from '../components/recipes/CollectionPicker'
import { useRecipeContext } from '../context/RecipeContext'
import { useAppData } from '../lib/appData'
import { CookEntry, Recipe } from '../types'
import styles from './CollectionsPage.module.css'

// ─── Smart collections: automatic, no setup ────────────────────

export interface SmartCollection {
  id: string
  name: string
  emoji: string
  description: string
  match: (recipe: Recipe, cooked: Set<string>) => boolean
}

export const SMART_COLLECTIONS: SmartCollection[] = [
  {
    id: 'smart-quick',
    name: 'Quick weeknights',
    emoji: '⚡',
    description: 'On the table in 30 minutes or less.',
    match: (r) => r.totalTime != null && r.totalTime > 0 && r.totalTime <= 30,
  },
  {
    id: 'smart-tate',
    name: 'Made by Tate',
    emoji: '👨‍🍳',
    description: 'Original recipes from Tate’s own kitchen.',
    match: (r) => r.createdByTate,
  },
  {
    id: 'smart-new',
    name: 'Never cooked',
    emoji: '✨',
    description: 'Saved but not made yet. Pick one tonight.',
    match: (r, cooked) => !cooked.has(r.id),
  },
]

export function smartRecipes(smart: SmartCollection, recipes: Recipe[], cookLog: CookEntry[]): Recipe[] {
  const cooked = new Set(cookLog.map((c) => c.recipeId))
  return recipes.filter((r) => smart.match(r, cooked))
}

// ─── Mosaic ────────────────────────────────────────────────────

export function Mosaic({ recipes, emoji, large }: { recipes: Recipe[]; emoji: string; large?: boolean }) {
  if (recipes.length === 0) {
    return (
      <div className={`${styles.mosaic} ${styles.mosaicEmpty}`}>
        <span className={styles.placeholderEmoji}>{emoji}</span>
      </div>
    )
  }
  if (recipes.length < 3) {
    return (
      <div className={`${styles.mosaic} ${recipes.length === 2 ? styles.mosaicTwo : styles.mosaicOne}`}>
        {recipes.slice(0, 2).map((r) => (
          <div key={r.id} className={styles.tile}><RecipeCover recipe={r} size={large ? 'md' : 'sm'} /></div>
        ))}
      </div>
    )
  }
  const tiles = recipes.slice(0, 4)
  return (
    <div className={styles.mosaic}>
      {tiles.map((r) => (
        <div key={r.id} className={styles.tile}><RecipeCover recipe={r} size="sm" /></div>
      ))}
      {tiles.length === 3 && <div className={`${styles.tile} ${styles.tileBlank}`}>{emoji}</div>}
    </div>
  )
}

export function CollectionsPage() {
  const { recipes, getRecipe, loading } = useRecipeContext()
  const { collections, cookLog, createCollection } = useAppData()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  const smart = useMemo(
    () => SMART_COLLECTIONS.map((s) => ({ ...s, recipes: smartRecipes(s, recipes, cookLog) })),
    [recipes, cookLog],
  )

  const sorted = useMemo(
    () => [...collections].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [collections],
  )

  return (
    <div>
      <PageHeader
        eyebrow="Your cookbook"
        title={<>Collections</>}
        subtitle="Group recipes however you think about them: holidays, date nights, things to try. Smart collections fill themselves."
        actions={<Button icon={<PlusIcon size={16} />} onClick={() => setCreating(true)}>New collection</Button>}
      />

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Smart collections</h2>
          <p className={styles.sectionNote}>Updated automatically</p>
        </div>
        <div className={styles.smartGrid}>
          {smart.map((s, i) => (
            <Link
              key={s.id}
              to={`/collections/${s.id}`}
              className={`${styles.smart} ${styles[`smart${i}`]}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={styles.smartText}>
                <span className={styles.smartEmoji}>{s.emoji}</span>
                <h3 className={styles.smartName}>{s.name}</h3>
                <p className={styles.smartDesc}>{s.description}</p>
                <span className={styles.smartCount}>
                  {loading ? '…' : `${s.recipes.length} recipe${s.recipes.length === 1 ? '' : 's'}`}
                  <ArrowRightIcon size={14} />
                </span>
              </div>
              <div className={styles.fan} aria-hidden="true">
                {s.recipes.slice(0, 3).map((r, j) => (
                  <div key={r.id} className={`${styles.fanCard} ${styles[`fan${j}`]}`}>
                    <RecipeCover recipe={r} size="sm" />
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Your collections</h2>
          {sorted.length > 0 && <p className={styles.sectionNote}>{sorted.length} collection{sorted.length === 1 ? '' : 's'}</p>}
        </div>

        {sorted.length === 0 ? (
          <button className={styles.emptyCard} onClick={() => setCreating(true)}>
            <span className={styles.emptyEmojis} aria-hidden="true">🎄 🍝 🌮</span>
            <span className={styles.emptyTitle}>Make your first collection</span>
            <span className={styles.emptyText}>Holiday baking, date-night dinners, recipes to try someday. Whatever helps you find them again.</span>
            <span className={styles.emptyCta}><PlusIcon size={14} strokeWidth={2.25} /> New collection</span>
          </button>
        ) : (
          <div className={styles.grid}>
            {sorted.map((c, i) => {
              const rs = c.recipeIds.map((id) => getRecipe(id)).filter((r): r is Recipe => !!r)
              return (
                <Link
                  key={c.id}
                  to={`/collections/${c.id}`}
                  className={styles.card}
                  style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                >
                  <Mosaic recipes={rs} emoji={c.emoji} />
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardName}><span className={styles.cardEmoji}>{c.emoji}</span>{c.name}</h3>
                    <p className={styles.cardCount}>{rs.length} recipe{rs.length === 1 ? '' : 's'}</p>
                    {c.description && <p className={styles.cardDesc}>{c.description}</p>}
                  </div>
                </Link>
              )
            })}
            <button className={styles.addCard} onClick={() => setCreating(true)}>
              <span className={styles.addIcon}><PlusIcon size={20} strokeWidth={2} /></span>
              New collection
            </button>
          </div>
        )}
      </section>

      <CollectionFormModal
        isOpen={creating}
        onClose={() => setCreating(false)}
        title="New collection"
        submitLabel="Create collection"
        onSubmit={(v) => {
          const c = createCollection(v)
          navigate(`/collections/${c.id}`)
        }}
      />
    </div>
  )
}
