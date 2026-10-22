import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { isDemo } from '../../lib/supabase'
import styles from './LoginModal.module.css'

/** The admin sign-in pop-up, opened from the footer. */
export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function close() {
    setPassword('')
    setError('')
    onClose()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email.trim(), password)
      close()
      navigate('/manage')
    } catch {
      setError('That email and password didn’t match.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Admin sign in" size="sm">
      <form className={styles.form} onSubmit={submit}>
        <label>
          <span className="field-label">Email</span>
          <input
            className="field-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          <span className="field-label">Password</span>
          <input
            className="field-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {isDemo && <p className={styles.hint}>Demo mode: any email and password works.</p>}
        <Button type="submit" fullWidth disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
    </Modal>
  )
}
