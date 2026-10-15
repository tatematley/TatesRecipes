import { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { RecipeCover } from '../ui/RecipeCover'
import { CheckIcon, SearchIcon } from '../ui/Icons'
import { Button } from '../ui/Button'
import { useRecipeContext } from '../../context/RecipeContext'
import { searchRecipes } from '../../utils/search'
import { formatTime } from '../../utils/helpers'
import styles from './RecipePickerModal.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  /** Called with the chosen ids when the user confirms */
  onPick: (recipeIds: string[]) => void
  multiple?: boolean
  /** Already selected (shown checked) */
  initial?: string[]
  confirmLabel?: string
}

/** Searchable list of recipes to pick one or many. */
export function RecipePickerModal({ isOpen, onClose, title, onPick, multiple = false, initial = [], confirmLabel = 'Add' }: Props) {
  const { recipes } = useRecipeContext()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>(initial)
  const results = useMemo(() => searchRecipes(recipes, query), [recipes, query])

  function choose(id: string) {
    if (!multiple) {
      onPick([id])
      onClose()
      setQuery('')
      return
    }
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={multiple ? (
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onPick(picked); onClose(); setQuery('') }}>
            {confirmLabel}{picked.length ? ` (${picked.length})` : ''}
          </Button>
        </>
      ) : undefined}
    >
      <div className={styles.search}>
        <SearchIcon size={16} strokeWidth={1.75} />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your recipes…" />
      </div>
      <div className={styles.list}>
        {results.map((r) => {
          const on = picked.includes(r.id)
          return (
            <button key={r.id} className={`${styles.item} ${on ? styles.on : ''}`} onClick={() => choose(r.id)}>
              <span className={styles.thumb}><RecipeCover recipe={r} size="sm" /></span>
              <span className={styles.text}>
                <span className={styles.name}>{r.title}</span>
                <span className={styles.meta}>{[r.category, r.totalTime ? formatTime(r.totalTime) : ''].filter(Boolean).join(' · ')}</span>
              </span>
              {multiple && <span className={styles.check}>{on && <CheckIcon size={14} strokeWidth={3} />}</span>}
            </button>
          )
        })}
        {results.length === 0 && <p className={styles.empty}>No recipes match “{query}”.</p>}
      </div>
    </Modal>
  )
}
