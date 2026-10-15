import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { RecipeFormPage } from '../../pages/RecipeFormPage'
import styles from './AddRecipeModal.module.css'

/** The new-recipe form as a white pop-up over the page. */
export function AddRecipeModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return createPortal(
    <div className={styles.overlay}>
      <div className={`${styles.modal} light-surface`} role="dialog" aria-modal="true" aria-label="New recipe">
        <RecipeFormPage onClose={onClose} />
      </div>
    </div>,
    document.body,
  )
}
