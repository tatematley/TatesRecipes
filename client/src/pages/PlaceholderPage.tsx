import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import styles from './Dashboard.module.css'

interface PlaceholderPageProps {
  emoji: string
  title: string
  phase: number
  description: string
}

export function PlaceholderPage({ emoji, title, phase, description }: PlaceholderPageProps) {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{emoji} {title}</h1>
          <p className={styles.subtitle}>Coming in Phase {phase}</p>
        </div>
      </div>
      <div style={{ padding: '60px 28px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>{emoji}</div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 12 }}>{title}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: 24 }}>{description}</p>
        <Button variant="secondary" onClick={() => navigate('/')}>← Back to Recipe Box</Button>
      </div>
    </div>
  )
}
