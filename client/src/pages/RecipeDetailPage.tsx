import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useRecipeContext } from '../context/RecipeContext'
import { StarButton } from '../components/ui/StarButton'
import { Tag } from '../components/ui/Tag'
import { Button } from '../components/ui/Button'
import { TatesTips } from '../components/recipes/TatesTips'
import { Modal } from '../components/ui/Modal'
import { formatTime } from '../utils/helpers'
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
        <span className={styles.notFoundEmoji}>🍽️</span>
        <h2>Recipe not found</h2>
        <Button onClick={() => navigate('/')}>Back to Recipe Box</Button>
      </div>
    )
  }

  function handleDelete() {
    deleteRecipe(recipe!.id)
    navigate('/')
  }

  function scaleQty(qty: string): string {
    if (!qty || scale === 1) return qty
    const num = parseFloat(qty.replace(/\s+/g, '+').replace(/ /g, '+'))
    if (isNaN(num)) return qty
    const parts = qty.trim().split(' ')
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
    if (result === Math.floor(result)) return String(result)
    const fractions: [number, string][] = [[0.25,'¼'],[0.33,'⅓'],[0.5,'½'],[0.67,'⅔'],[0.75,'¾']]
    const whole = Math.floor(result)
    const frac = result - whole
    const match = fractions.find(([f]) => Math.abs(frac - f) < 0.05)
    if (match) return whole > 0 ? `${whole} ${match[1]}` : match[1]
    return result.toFixed(2).replace(/\.?0+$/, '')
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <img
          src={recipe.heroImage || PLACEHOLDER}
          alt={recipe.title}
          className={styles.heroImage}
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadges}>
            {recipe.createdByTate && (
              <span className={styles.tateBadge}>👨‍🍳 Created by Tate</span>
            )}
            <span className={styles.categoryBadge}>{recipe.category}</span>
          </div>
          <h1 className={styles.heroTitle}>{recipe.title}</h1>
          {recipe.description && (
            <p className={styles.heroDesc}>{recipe.description}</p>
          )}
        </div>
      </div>

      {/* Actions Bar */}
      <div className={styles.actionsBar + ' no-print recipe-actions'}>
        <div className={styles.backBtn}>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={<span>←</span>}>
            Back
          </Button>
        </div>
        <div className={styles.actionBtns}>
          <StarButton
            isFavorite={recipe.isFavorite}
            onToggle={() => toggleFavorite(recipe.id)}
            size="md"
          />
          <Button variant="secondary" size="sm" onClick={() => navigate(`/edit/${recipe.id}`)} icon={<span>✏️</span>}>
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()} icon={<span>🖨️</span>}>
            Print
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className={styles.content + ' print-recipe'}>
        {/* Meta */}
        <div className={styles.metaRow}>
          {recipe.prepTime != null && (
            <div className={styles.metaCard}>
              <span className={styles.metaIcon}>⏱</span>
              <span className={styles.metaLabel}>Prep</span>
              <span className={styles.metaValue}>{formatTime(recipe.prepTime)}</span>
            </div>
          )}
          {recipe.cookTime != null && (
            <div className={styles.metaCard}>
              <span className={styles.metaIcon}>🔥</span>
              <span className={styles.metaLabel}>Cook</span>
              <span className={styles.metaValue}>{formatTime(recipe.cookTime)}</span>
            </div>
          )}
          {recipe.totalTime != null && (
            <div className={[styles.metaCard, styles.metaCardTotal].join(' ')}>
              <span className={styles.metaIcon}>⏰</span>
              <span className={styles.metaLabel}>Total</span>
              <span className={styles.metaValue}>{formatTime(recipe.totalTime)}</span>
            </div>
          )}
          {recipe.servings != null && (
            <div className={styles.metaCard}>
              <span className={styles.metaIcon}>🍽</span>
              <span className={styles.metaLabel}>Serves</span>
              <span className={styles.metaValue}>{recipe.servings}</span>
            </div>
          )}
          {recipe.difficulty && (
            <div className={styles.metaCard}>
              <span className={styles.metaIcon}>📊</span>
              <span className={styles.metaLabel}>Level</span>
              <span className={styles.metaValue} style={{ textTransform: 'capitalize' }}>{recipe.difficulty}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className={styles.tags}>
            {recipe.tags.map((tag) => <Tag key={tag} label={tag} />)}
          </div>
        )}

        {/* Scale control */}
        <div className={styles.scaleRow + ' no-print'}>
          <span className={styles.scaleLabel}>Scale recipe:</span>
          {[0.5, 1, 2, 3].map((s) => (
            <button
              key={s}
              className={[styles.scaleBtn, scale === s ? styles.scaleActive : ''].join(' ')}
              onClick={() => setScale(s)}
            >
              {s === 0.5 ? '½×' : `${s}×`}
            </button>
          ))}
        </div>

        {/* Two-column layout */}
        <div className={styles.twoCol}>
          {/* Ingredients */}
          <div className={styles.column}>
            <h2 className={styles.sectionTitle}>Ingredients</h2>
            {recipe.servings && scale !== 1 && (
              <p className={styles.servingNote}>
                Scaled for {Math.round(recipe.servings * scale)} servings
              </p>
            )}
            <ul className={styles.ingredientList}>
              {recipe.ingredients
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((ing) => (
                  <li key={ing.id} className={styles.ingredient}>
                    <span className={styles.ingredientDot} />
                    <span>
                      {scaleQty(ing.quantity)}
                      {ing.measurement && ` ${ing.measurement}`}
                      {' '}
                      <strong>{ing.name}</strong>
                      {ing.preparation && <em className={styles.prep}>, {ing.preparation}</em>}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className={styles.column}>
            <h2 className={styles.sectionTitle}>Instructions</h2>
            <ol className={styles.instructionList}>
              {recipe.instructions
                .slice()
                .sort((a, b) => a.step - b.step)
                .map((inst) => (
                  <li key={inst.id} className={styles.instructionItem}>
                    <div className={styles.stepNum}>{inst.step}</div>
                    <p className={styles.stepText}>{inst.text}</p>
                  </li>
                ))}
            </ol>
          </div>
        </div>

        {/* Tate's Tips */}
        {recipe.tatesTips && <TatesTips tips={recipe.tatesTips} />}

        {/* Source */}
        {recipe.sourceUrl && (
          <div className={styles.source}>
            <span className={styles.sourceLabel}>Source:</span>
            <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
              {recipe.sourceName || recipe.sourceUrl}
            </a>
          </div>
        )}

        {/* Photos */}
        {recipe.photos.length > 0 && (
          <div className={styles.photosSection + ' no-print'}>
            <h2 className={styles.sectionTitle}>My Photos</h2>
            <div className={styles.photosGrid}>
              {recipe.photos.map((photo) => (
                <div key={photo.id} className={styles.photoCard}>
                  <img src={photo.url} alt={photo.caption || 'Recipe photo'} className={styles.photoImg} />
                  {(photo.caption || photo.dateMade) && (
                    <div className={styles.photoMeta}>
                      {photo.dateMade && <span className={styles.photoDate}>{new Date(photo.dateMade).toLocaleDateString()}</span>}
                      {photo.caption && <span>{photo.caption}</span>}
                      {photo.rating && <span>{'★'.repeat(photo.rating)}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Recipe"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-body)', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{recipe.title}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
