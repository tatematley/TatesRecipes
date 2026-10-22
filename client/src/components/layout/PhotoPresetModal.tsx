import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useRecipeContext } from '../../context/RecipeContext'
import { gradeAllPhotos, restoreAllPhotos } from '../../lib/preset'
import styles from './LoginModal.module.css'

/** Admin tool: apply the photo look to every recipe photo, or undo it. */
export function PhotoPresetModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { recipes, updateRecipe } = useRecipeContext()
  const [busy, setBusy] = useState<'grade' | 'restore' | null>(null)
  const [progress, setProgress] = useState<[number, number] | null>(null)
  const [message, setMessage] = useState('')

  async function run(kind: 'grade' | 'restore') {
    setBusy(kind)
    setMessage('')
    try {
      const fn = kind === 'grade' ? gradeAllPhotos : restoreAllPhotos
      await fn(recipes, updateRecipe, (done, total) => setProgress([done, total]))
      setMessage(kind === 'grade' ? 'All photos have the look.' : 'Original photos are back.')
    } catch (err) {
      console.error(err)
      setMessage('Something went wrong partway. Run it again to pick up where it stopped.')
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => !busy && onClose()} title="Photo look" size="sm">
      <div className={styles.form}>
        <p className={styles.hint}>
          Applies the “1 LO” preset at 25% to every recipe photo. New photos get it automatically.
          Originals are kept, so you can restore them anytime.
        </p>
        {progress && <p className={styles.hint}>{busy === 'grade' ? 'Applying' : 'Restoring'}… {progress[0]} of {progress[1]} recipes</p>}
        {message && <p className={styles.hint} role="status">{message}</p>}
        <Button fullWidth onClick={() => run('grade')} disabled={!!busy}>
          {busy === 'grade' ? 'Applying…' : 'Apply to all photos'}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => run('restore')} disabled={!!busy}>
          {busy === 'restore' ? 'Restoring…' : 'Restore originals'}
        </Button>
      </div>
    </Modal>
  )
}
