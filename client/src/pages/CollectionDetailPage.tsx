import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'
import { ArrowLeftIcon, PencilIcon, PlusIcon, ShoppingBagIcon, SparkleIcon, TrashIcon, XIcon, CheckIcon } from '../components/ui/Icons'
import { RecipeCard } from '../components/recipes/RecipeCard'
import { RecipeGrid } from '../components/recipes/RecipeGrid'
import { RecipePickerModal } from '../components/recipes/RecipePickerModal'
import { CollectionFormModal } from '../components/recipes/CollectionPicker'
import { useRecipeContext } from '../context/RecipeContext'
import { useAppData } from '../lib/appData'
import { Recipe } from '../types'
import { SMART_COLLECTIONS, smartRecipes } from './CollectionsPage'
import { CollectionIcon } from '../components/ui/FoodIcons'
import { FolderIcon } from '../components/ui/Icons'
import styles from './CollectionDetailPage.module.css'

export function CollectionDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { recipes, getRecipe, loading } = useRecipeContext()
  const { collections, cookLog, updateCollection, deleteCollection, addRecipesToGrocery } = useAppData()

  const [picking, setPicking] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [manage, setManage] = useState(false)

  const smart = SMART_COLLECTIONS.find((s) => s.id === id)
  const collection = collections.find((c) => c.id === id)

  const list: Recipe[] = useMemo(() => {
    if (smart) return smartRecipes(smart, recipes, cookLog)
    if (collection) return collection.recipeIds.map((rid) => getRecipe(rid)).filter((r): r is Recipe => !!r)
    return []
  }, [smart, collection, recipes, cookLog, getRecipe])

  const totalMinutes = list.reduce((sum, r) => sum + (r.totalTime ?? 0), 0)
  const tateCount = list.filter((r) => r.createdByTate).length

  function shop() {
    if (!list.length) return
    const n = addRecipesToGrocery(list.map((recipe) => ({ recipe })))
    toast(`Added ${n} item${n === 1 ? '' : 's'} from ${list.length} recipe${list.length === 1 ? '' : 's'}`, { label: 'View list', to: '/grocery' })
  }

  function removeRecipe(r: Recipe) {
    if (!collection) return
    const prev = collection.recipeIds
    updateCollection(collection.id, { recipeIds: prev.filter((x) => x !== r.id) })
    toast(`Removed ${r.title}`, { label: 'Undo', onClick: () => updateCollection(collection.id, { recipeIds: prev }) })
  }

  const back = (
    <Link to="/collections" className={styles.back}>
      <ArrowLeftIcon size={15} /> Collections
    </Link>
  )

  if (!smart && !collection) {
    return (
      <div>
        {back}
        <EmptyState
          icon={<FolderIcon size={26} />}
          title="Collection not found"
          message="It may have been deleted, or the link is out of date."
          action={{ label: 'All collections', onClick: () => navigate('/collections') }}
        />
      </div>
    )
  }

  const name = smart?.name ?? collection!.name
  const emoji = smart?.emoji ?? collection!.emoji
  const description = smart?.description ?? collection!.description

  return (
    <div>
      {back}

      <header className={styles.hero}>
        <div className={styles.emojiTile} aria-hidden="true"><CollectionIcon icon={emoji} size={44} strokeWidth={1.25} /></div>
        <div className={styles.heroText}>
          <p className="eyebrow">
            {smart ? <span className={styles.smartTag}><SparkleIcon size={11} strokeWidth={2} /> Smart collection</span> : 'Collection'}
          </p>
          <h1 className={styles.title}>
            {collection ? (
              <button className={styles.editable} onClick={() => setEditing(true)} title="Edit name and description">
                {name}
                <PencilIcon size={16} className={styles.pencil} />
              </button>
            ) : name}
          </h1>
          {description ? (
            <p className={styles.desc}>{description}</p>
          ) : collection ? (
            <button className={styles.addDesc} onClick={() => setEditing(true)}>Add a description</button>
          ) : null}
          <p className={styles.stats}>
            <span><strong>{list.length}</strong> recipe{list.length === 1 ? '' : 's'}</span>
            {tateCount > 0 && <span><strong>{tateCount}</strong> by Tate</span>}
            {list.length > 0 && totalMinutes > 0 && (
              <span>avg <strong>{Math.round(totalMinutes / list.filter((r) => r.totalTime).length)}</strong> min</span>
            )}
          </p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.toolbarMain}>
          {collection && (
            <Button icon={<PlusIcon size={16} />} onClick={() => setPicking(true)}>Add recipes</Button>
          )}
          <Button variant="secondary" icon={<ShoppingBagIcon size={16} />} onClick={shop} disabled={!list.length}>
            Shop this collection
          </Button>
        </div>
        {collection && (
          <div className={styles.toolbarSide}>
            {list.length > 0 && (
              <Button
                variant={manage ? 'primary' : 'ghost'}
                size="sm"
                icon={manage ? <CheckIcon size={14} /> : <PencilIcon size={14} />}
                onClick={() => setManage((m) => !m)}
              >
                {manage ? 'Done' : 'Manage'}
              </Button>
            )}
            <Button variant="ghost" size="sm" icon={<TrashIcon size={14} />} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {loading && list.length === 0 ? (
        <div className={styles.grid}>
          {[0, 1, 2, 3].map((i) => <div key={i} className={`skeleton ${styles.skel}`} />)}
        </div>
      ) : smart ? (
        <RecipeGrid
          recipes={list}
          emptyTitle="Nothing here yet"
          emptyMessage={smart.id === 'smart-new' ? 'You have cooked everything. Impressive.' : 'Recipes that fit will show up here automatically.'}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<CollectionIcon icon={emoji} size={26} />}
          title="An empty collection"
          message="Pick a few recipes to start filling it up."
          action={{ label: 'Add recipes', onClick: () => setPicking(true) }}
        />
      ) : (
        <div className={`${styles.grid} ${manage ? styles.managing : ''}`}>
          {list.map((r, i) => (
            <div key={r.id} className={styles.cell}>
              <RecipeCard recipe={r} index={i} />
              <button
                className={styles.remove}
                onClick={() => removeRecipe(r)}
                aria-label={`Remove ${r.title} from collection`}
                title="Remove from collection"
              >
                <XIcon size={14} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {collection && (
        <>
          <RecipePickerModal
            key={picking ? 'open' : 'closed'}
            isOpen={picking}
            onClose={() => setPicking(false)}
            title={`Recipes in ${collection.name}`}
            multiple
            initial={collection.recipeIds}
            confirmLabel="Save"
            onPick={(ids) => {
              updateCollection(collection.id, { recipeIds: ids })
              const added = ids.filter((x) => !collection.recipeIds.includes(x)).length
              const removed = collection.recipeIds.filter((x) => !ids.includes(x)).length
              if (added || removed) {
                toast([added && `Added ${added}`, removed && `removed ${removed}`].filter(Boolean).join(', ') + ` recipe${added + removed === 1 ? '' : 's'}`)
              }
            }}
          />
          <CollectionFormModal
            isOpen={editing}
            onClose={() => setEditing(false)}
            title="Edit collection"
            submitLabel="Save"
            initial={collection}
            onSubmit={(v) => updateCollection(collection.id, v)}
          />
          <Modal
            isOpen={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            title="Delete collection?"
            size="sm"
            footer={
              <>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <Button
                  variant="danger"
                  icon={<TrashIcon size={15} />}
                  onClick={() => {
                    deleteCollection(collection.id)
                    setConfirmDelete(false)
                    toast(`Deleted ${collection.name}`)
                    navigate('/collections')
                  }}
                >
                  Delete
                </Button>
              </>
            }
          >
            <p className={styles.confirm}>
              <strong>{collection.name}</strong> will be removed. The {collection.recipeIds.length} recipe{collection.recipeIds.length === 1 ? '' : 's'} in it stay in your cookbook.
            </p>
          </Modal>
        </>
      )}
    </div>
  )
}
