import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useAppData, todayISO } from '../../lib/appData'
import { useToast } from '../ui/Toast'
import styles from './CookLogModal.module.css'

interface Props {
  recipeId: string
  recipeTitle: string
  isOpen: boolean
  onClose: () => void
}

/** "I made this": date, rating, notes, and would-make-again. */
export function CookLogModal({ recipeId, recipeTitle, isOpen, onClose }: Props) {
  const { logCook } = useAppData()
  const toast = useToast()
  const [date, setDate] = useState(todayISO())
  const [rating, setRating] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [makeAgain, setMakeAgain] = useState<boolean | null>(null)

  function save() {
    logCook({ recipeId, date, rating, notes: notes.trim(), makeAgain })
    toast(`Logged “${recipeTitle}” 🎉`)
    setRating(null); setNotes(''); setMakeAgain(null); setDate(todayISO())
    onClose()
  }

  const shown = hover ?? rating ?? 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="I made this!"
      size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>Save to journal</Button></>}
    >
      <div className={styles.form}>
        <div>
          <label className="field-label">How was it?</label>
          <div className={styles.stars} onMouseLeave={() => setHover(null)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={n <= shown ? styles.starOn : styles.star}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(rating === n ? null : n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label">Make it again?</label>
          <div className={styles.choices}>
            {[{ v: true, l: '👍 Definitely' }, { v: false, l: '🤔 Probably not' }].map((c) => (
              <button key={String(c.v)} className={`${styles.choice} ${makeAgain === c.v ? styles.choiceOn : ''}`} onClick={() => setMakeAgain(makeAgain === c.v ? null : c.v)}>
                {c.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="cook-notes">Notes for next time</label>
          <textarea id="cook-notes" className="field-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Added extra garlic, baked 2 minutes less…" />
        </div>
        <div>
          <label className="field-label" htmlFor="cook-date">When</label>
          <input id="cook-date" type="date" className="field-input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
