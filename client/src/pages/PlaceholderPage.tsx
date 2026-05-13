import { Button } from '../components/ui/Button'
import { ArrowLeftIcon } from '../components/ui/Icons'
import { useNavigate } from 'react-router-dom'
import styles from './Dashboard.module.css'
import pageStyles from './PlaceholderPage.module.css'

interface PlaceholderPageProps {
  title: string
  phase: number
  description: string
}

export function PlaceholderPage({ title, phase, description }: PlaceholderPageProps) {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>Coming in Phase {phase}</p>
        </div>
      </div>
      <div className={pageStyles.body}>
        <div className={pageStyles.card}>
          <p className={pageStyles.phase}>Phase {phase}</p>
          <h2 className={pageStyles.cardTitle}>{title}</h2>
          <p className={pageStyles.cardDesc}>{description}</p>
          <Button variant="secondary" size="sm" onClick={() => navigate('/')} icon={<ArrowLeftIcon size={13} strokeWidth={2} />}>
            Back to Recipe Box
          </Button>
        </div>
      </div>
    </div>
  )
}
