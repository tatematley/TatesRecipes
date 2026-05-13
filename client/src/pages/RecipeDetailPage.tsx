import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useRecipeContext } from '../context/RecipeContext'
import { StarButton } from '../components/ui/StarButton'
import { Tag } from '../components/ui/Tag'
import { Button } from '../components/ui/Button'
import { TatesTips } from '../components/recipes/TatesTips'
import { Modal } from '../components/ui/Modal'
import { formatTime } from '../utils/helpers'
import {
  ArrowLeftIcon, PencilIcon, TrashIcon, PrinterIcon,
  ClockIcon, FlameIcon, UsersIcon, BarChartIcon, LinkIcon,
} from '../components/ui/Icons'
import styles from './RecipeDetailPage.module.css'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getRecipe, toggleFavorite, deleteRecipe } = useRecipeContext()
  const [scale, setScale] = useState(1)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const recipe = getRecipe(id!)

  if (!recipe) {
    return (
      <div className={styles.notFound}>
        <h2>Recipe not found</h2>
        <Button variant="secondary" onClick={() => navigate('/')}>Back to Recipe Box</Button>
      </div>
    )
  }

  function handleDelete() {
    deleteRecipe(recipe!.id)
    navigate('/')
  }

  function scaleQty(qty: string): string {
    if (!qty || scale === 1) return qty
    const parts = qty.trim().split(/\s+/)
    let value = 0
    for (const p of parts) {
      if (p.includes('/')) {
        const [a, b] = p.split('/')
        value += parseInt(a) / parseInt(b)
      } else {
        value += parseFloat(p) || 0
      }
    }
    const result = value * scale
    const fractions: [number, string][] = [[0.25,'¼'],[0.33,'⅓'],[0.5,'½'],[0.67,'⅔'],[0.75,'¾']]
    const whole = Math.floor(result)
    const frac = result - whole
    const match = fractions.find(([f]) => Math.abs(frac - f) < 0.05)
    if (match) return whole > 0 ? `${whole} ${match[1]}` : match[1]
    if (result === Math.floor(result)) return String(result)
    return result.toFixed(2).replace(/\.?0+$/, '')
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar + ' no-print'}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeftIcon size={13} strokeWidth={2} />}>
          Back
        </Button>
        <div className={styles.topActions}>
          <StarButton isFavorite={recipe.isFavorite} onToggle={() => toggleFavorite(recipe.id)} size="sm" />
          <Button variant="secondary" size="sm" onClick={() => navigate(`/edit/${recipe.id}`)} icon={<PencilIcon size={13} />}>
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()} icon={<PrinterIcon size={13} />}>
            Print
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)} icon={<TrashIcon size={13} />}>
            Delete
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <img
          src={recipe.heroImage || PLACEHOLDER}
          alt={recipe.title}
          className={styles.heroImage}
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Title block */}
        <div className={styles.titleBlock}>
          <div className={styles.titleMeta}>
            <span className={styles.categoryLabel}>{recipe.category}</span>
            {recipe.createdByTate && <span className={styles.tatePill}>Created by Tate</span>}
          </div>
          <h1 className={styles.title}>{recipe.title}</h1>
          {recipe.description && <p className={styles.description}>{recipe.description}</p>}
        </div>

        <div className={styles.divider} />

        {/* Stats strip */}
        <div className={styles.statsStrip}>
          {recipe.prepTime != null && (
            <div className={styles.stat}>
              <ClockIcon size={14} strokeWidth={1.5} className={styles.statIcon} />
              <div>
                <p className={styles.statLabel}>Prep</p>
                <p className={styles.statValue}>{formatTime(recipe.prepTime)}</p>
              </div>
            </div>
          )}
          {recipe.cookTime != null && (
            <div className={styles.stat}>
              <FlameIcon size={14} strokeWidth={1.5} className={styles.statIcon} />
              <div>
                <p className={styles.statLabel}>Cook</p>
                <p className={styles.statValue}>{formatTime(recipe.cookTime)}</p>
              </div>
            </div>
          )}
          {recipe.totalTime != null && (
            <div className={[styles.stat, styles.statTotal].join(' ')}>
              <div>
                <p className={styles.statLabel}>Total</p>
                <p className={styles.statValue}>{formatTime(recipe.totalTime)}</p>
              </div>
            </div>
          )}
          {recipe.servings != null && (
            <div className={styles.stat}>
              <UsersIcon size={14} strokeWidth={1.5} className={styles.statIcon} />
              <div>
                <p className={styles.statLabel}>Serves</p>
                <p className={styles.statValue}>{recipe.servings}</p>
              </div>
            </div>
          )}
          {recipe.difficulty && (
            <div className={styles.stat}>
              <BarChartIcon size={14} strokeWidth={1.5} className={styles.statIcon} />
              <div>
                <p className={styles.statLabel}>Level</p>
                <p className={styles.statValue} style={{ textTransform: 'capitalize' }}>{recipe.difficulty}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className={styles.tags}>
            {recipe.tags.map((tag) => <Tag key={tag} label={tag} variant="outlined" />)}
          </div>
        )}

        {/* Scale control */}
        <div className={styles.scaleRow + ' no-print'}>
          <span className={styles.scaleLabel}>Scale:</span>
          {[0.5, 1, 2, 3].map((s) => (
            <button
              key={s}
              className={[styles.scaleBtn, scale === s ? styles.scaleActive : ''].join(' ')}
              onClick={() => setScale(s)}
            >
              {s === 0.5 ? '½×' : `${s}×`}
            </button>
          ))}
          {recipe.servings && scale !== 1 && (
            <span className={styles.servingNote}>{Math.round(recipe.servings * scale)} servings</span>
          )}
        </div>

        <div className={styles.divider} />

        {/* Two columns */}
        <div className={styles.twoCol}>
          <div className={styles.ingredientsCol}>
            <h2 className={styles.sectionTitle}>Ingredients</h2>
            <ul className={styles.ingredientList}>
              {recipe.ingredients
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((ing) => (
                  <li key={ing.id} className={styles.ingredient}>
                    <span className={styles.ingredientBullet} />
                    <span>
                      {scaleQty(ing.quantity)}
                      {ing.measurement && ` ${ing.measurement}`}{' '}
                      <strong>{ing.name}</strong>
                      {ing.preparation && <em className={styles.prep}>, {ing.preparation}</em>}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          <div className={styles.instructionsCol}>
            <h2 className={styles.sectionTitle}>Instructions</h2>
            <ol className={styles.instructionList}>
              {recipe.instructions
                .slice()
                .sort((a, b) => a.step - b.step)
                .map((inst) => (
                  <li key={inst.id} className={styles.step}>
                    <span className={styles.stepNum}>{inst.step}</span>
                    <p className={styles.stepText}>{inst.text}</p>
                  </li>
                ))}
            </ol>
          </div>
        </div>

        {/* Tate's Tips */}
        {recipe.tatesTips && (
          <>
            <div className={styles.divider} />
            <TatesTips tips={recipe.tatesTips} />
          </>
        )}

        {/* Source */}
        {recipe.sourceUrl && (
          <div className={styles.source}>
            <LinkIcon size={12} strokeWidth={1.75} />
            <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
              {recipe.sourceName || recipe.sourceUrl}
            </a>
          </div>
        )}
      </div>

      {/* Delete modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete recipe"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-body)', lineHeight: 1.65 }}>
          Delete <strong>{recipe.title}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
