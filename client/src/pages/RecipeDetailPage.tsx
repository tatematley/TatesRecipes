import { useNavigate, useParams } from 'react-router-dom'
import { useState, useRef } from 'react'
import { useRecipeContext } from '../context/RecipeContext'
import { StarButton } from '../components/ui/StarButton'
import { Tag } from '../components/ui/Tag'
import { Button } from '../components/ui/Button'
import { TatesTips } from '../components/recipes/TatesTips'
import { Modal } from '../components/ui/Modal'
import { formatTime } from '../utils/helpers'
import { uploadPhoto } from '../lib/db'
import { Photo } from '../types'
import {
  ArrowLeftIcon, PencilIcon, TrashIcon, PrinterIcon,
  ClockIcon, FlameIcon, UsersIcon, BarChartIcon, LinkIcon, PlusIcon,
} from '../components/ui/Icons'
import styles from './RecipeDetailPage.module.css'


export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getRecipe, toggleFavorite, deleteRecipe, updateRecipe } = useRecipeContext()
  const [scale, setScale] = useState(1)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const recipe = getRecipe(id!)

  if (!recipe) {
    return (
      <div className={styles.notFound}>
        <h2>Recipe not found</h2>
        <Button variant="secondary" onClick={() => navigate('/')}>Back to Recipe Box</Button>
      </div>
    )
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteRecipe(recipe!.id)
    navigate('/')
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadPhoto(recipe!.id, file)
      const newPhoto: Photo = {
        id: crypto.randomUUID(),
        url,
        dateMade: new Date().toISOString().split('T')[0],
      }
      await updateRecipe(recipe!.id, {
        photos: [...recipe!.photos, newPhoto],
      })
    } catch (err) {
      console.error('Photo upload failed:', err)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
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
    const fracs: [number, string][] = [[0.25,'¼'],[0.33,'⅓'],[0.5,'½'],[0.67,'⅔'],[0.75,'¾']]
    const whole = Math.floor(result)
    const frac  = result - whole
    const match = fracs.find(([f]) => Math.abs(frac - f) < 0.05)
    if (match) return whole > 0 ? `${whole} ${match[1]}` : match[1]
    if (result === Math.floor(result)) return String(result)
    return result.toFixed(2).replace(/\.?0+$/, '')
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar + ' no-print'}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} icon={<ArrowLeftIcon size={13} strokeWidth={2} />}>
          All Recipes
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
        {recipe.heroImage && (
          <img src={recipe.heroImage} alt={recipe.title} className={styles.heroImage} />
        )}
      </div>

      {/* Content */}
      <div className={styles.content + ' print-recipe'}>
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

        {/* Scale */}
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
            {(() => {
              const sorted = recipe.ingredients.slice().sort((a, b) => a.order - b.order)
              const groups: { name: string; items: typeof sorted }[] = []
              for (const ing of sorted) {
                const g = ing.group ?? ''
                const existing = groups.find((x) => x.name === g)
                if (existing) existing.items.push(ing)
                else groups.push({ name: g, items: [ing] })
              }
              return groups.map((group) => (
                <div key={group.name || '__default__'} className={styles.ingredientGroup}>
                  {group.name && <p className={styles.ingredientGroupLabel}>{group.name}</p>}
                  <ul className={styles.ingredientList}>
                    {group.items.map((ing) => (
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
              ))
            })()}
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

        {/* My Photos */}
        <div className={styles.divider + ' no-print'} />
        <div className={styles.photosSection + ' no-print'}>
          <div className={styles.photosSectionHeader}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>My Photos</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              icon={<PlusIcon size={12} strokeWidth={2} />}
            >
              {uploading ? 'Uploading…' : 'Add Photo'}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
          </div>

          {recipe.photos.length === 0 ? (
            <p className={styles.noPhotos}>
              No photos yet — add one each time you make this recipe.
            </p>
          ) : (
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
          )}
        </div>
      </div>

      {/* Delete modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="Delete recipe"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
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
