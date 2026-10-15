import { Link } from 'react-router-dom'
import styles from './Brand.module.css'

export function Brand() {
  return (
    <Link to="/" className={styles.brand} aria-label="Made by Tate home">
      <img className={styles.logo} src="/logo.png" alt="Made by Tate" width={795} height={368} />
    </Link>
  )
}
