import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { RecipeCover } from '../ui/RecipeCover'
import { useToast } from '../ui/Toast'
import { CheckIcon, PlusIcon } from '../ui/Icons'
import { useAppData } from '../../lib/appData'
import { useRecipeContext } from '../../context/RecipeContext'
import { COLLECTION_ICON_KEYS, CollectionIcon, DEFAULT_COLLECTION_ICON } from '../ui/FoodIcons'
import styles from './CollectionPicker.module.css'


// ─── Shared form: name, icon, description ─────────────────────

/** `emoji` holds an icon key (see COLLECTION_ICONS); the name is kept for stored data. */
export interface CollectionDraft { name: string; emoji: string; description: string }

interface FormProps {
  value: CollectionDraft
  onChange: (v: CollectionDraft) => void
  onSubmit?: () => void
  autoFocus?: boolean
  compact?: boolean
}

export function CollectionFields({ value, onChange, onSubmit, autoFocus, compact }: FormProps) {
  return (
    <div className={styles.fields}>
      <div>
        <label className="field-label" htmlFor="col-name">Name</label>
        <div className={styles.nameRow}>
          <span className={styles.emojiPreview} aria-hidden="true"><CollectionIcon icon={value.emoji} size={20} /></span>
          <input
            id="col-name"
            className="field-input"
            value={value.name}
            autoFocus={autoFocus}
            maxLength={60}
            placeholder="e.g. Sunday suppers"
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && onSubmit) { e.preventDefault(); onSubmit() } }}
          />
        </div>
      </div>
      <div>
        <span className="field-label">Icon</span>
        <div className={styles.emojis} role="radiogroup" aria-label="Icon">
          {COLLECTION_ICON_KEYS.map((em) => (
            <button
              key={em}
              type="button"
              role="radio"
              aria-checked={value.emoji === em}
              className={`${styles.emoji} ${value.emoji === em ? styles.emojiOn : ''}`}
              aria-label={em}
              onClick={() => onChange({ ...value, emoji: em })}
            >
              <CollectionIcon icon={em} size={18} />
            </button>
          ))}
        </div>
      </div>
      {!compact && (
        <div>
          <label className="field-label" htmlFor="col-desc">Description <span className={styles.optional}>(optional)</span></label>
          <textarea
            id="col-desc"
            className="field-input"
            rows={3}
            value={value.description}
            placeholder="What ties these recipes together?"
            onChange={(e) => onChange({ ...value, description: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}

/** Modal to create or edit a collection's details. */
export function CollectionFormModal({ isOpen, onClose, title, initial, submitLabel, onSubmit }: {
  isOpen: boolean
  onClose: () => void
  title: string
  initial?: Partial<CollectionDraft>
  submitLabel: string
  onSubmit: (v: CollectionDraft) => void
}) {
  const [draft, setDraft] = useState<CollectionDraft>({ name: '', emoji: DEFAULT_COLLECTION_ICON, description: '' })
  useEffect(() => {
    if (isOpen) setDraft({ name: initial?.name ?? '', emoji: initial?.emoji ?? DEFAULT_COLLECTION_ICON, description: initial?.description ?? '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const valid = draft.name.trim().length > 0
  const submit = () => {
    if (!valid) return
    onSubmit({ ...draft, name: draft.name.trim(), description: draft.description.trim() })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!valid}>{submitLabel}</Button>
        </>
      }
    >
      <CollectionFields value={draft} onChange={setDraft} onSubmit={submit} autoFocus />
    </Modal>
  )
}

// ─── Picker used on the recipe page ────────────────────────────

interface PickerProps {
  recipeId: string
  isOpen: boolean
  onClose: () => void
}

export function CollectionPicker({ recipeId, isOpen, onClose }: PickerProps) {
  const { collections, toggleInCollection, createCollection } = useAppData()
  const { getRecipe } = useRecipeContext()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<CollectionDraft>({ name: '', emoji: DEFAULT_COLLECTION_ICON, description: '' })

  useEffect(() => {
    if (isOpen) {
      setCreating(collections.length === 0)
      setDraft({ name: '', emoji: DEFAULT_COLLECTION_ICON, description: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  function toggle(id: string, name: string, inIt: boolean) {
    toggleInCollection(id, recipeId)
    toast(inIt ? `Removed from ${name}` : `Saved to ${name}`, inIt ? undefined : { label: 'View', to: `/collections/${id}` })
  }

  function create() {
    const name = draft.name.trim()
    if (!name) return
    const c = createCollection({ name, emoji: draft.emoji, recipeIds: [recipeId] })
    toast(`Saved to ${c.name}`, { label: 'View', to: `/collections/${c.id}` })
    setCreating(false)
    setDraft({ name: '', emoji: DEFAULT_COLLECTION_ICON, description: '' })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save to collection"
      size="sm"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {collections.length > 0 && (
        <ul className={styles.list}>
          {collections.map((c) => {
            const inIt = c.recipeIds.includes(recipeId)
            const first = c.recipeIds.map((id) => getRecipe(id)).find(Boolean)
            return (
              <li key={c.id}>
                <button
                  className={`${styles.item} ${inIt ? styles.on : ''}`}
                  onClick={() => toggle(c.id, c.name, inIt)}
                  aria-pressed={inIt}
                >
                  <span className={styles.thumb}>
                    {first ? <RecipeCover recipe={first} size="sm" /> : <span className={styles.thumbEmoji}><CollectionIcon icon={c.emoji} size={18} /></span>}
                  </span>
                  <span className={styles.text}>
                    <span className={styles.name}>{c.name}</span>
                    <span className={styles.meta}>{c.recipeIds.length} recipe{c.recipeIds.length === 1 ? '' : 's'}</span>
                  </span>
                  <span className={styles.check}>{inIt && <CheckIcon size={14} strokeWidth={3} />}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {creating ? (
        <div className={styles.create}>
          <CollectionFields value={draft} onChange={setDraft} onSubmit={create} autoFocus compact />
          <div className={styles.createActions}>
            {collections.length > 0 && <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>}
            <Button size="sm" onClick={create} disabled={!draft.name.trim()} icon={<PlusIcon size={14} />}>
              Create &amp; save
            </Button>
          </div>
        </div>
      ) : (
        <button className={styles.newBtn} onClick={() => setCreating(true)}>
          <span className={styles.newIcon}><PlusIcon size={16} strokeWidth={2} /></span>
          New collection
        </button>
      )}
    </Modal>
  )
}
