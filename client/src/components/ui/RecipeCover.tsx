import { useState } from 'react'
import { Recipe } from '../../types'
import { CategoryIcon } from './FoodIcons'
import styles from './RecipeCover.module.css'

/** Curated palettes for recipes without a photo: [background, ink] */
const PALETTES: [string, string, string][] = [
  ['#DCE7F5', '#1F4E8C', '#C5D7EE'], // cornflower
  ['#E3F1FA', '#1F6E9E', '#CBE4F4'], // sky
  ['#D6E0EE', '#22406B', '#BFCFE5'], // slate
  ['#E1E6F7', '#3B4FA0', '#CBD3F0'], // periwinkle
  ['#D9EBF0', '#1D6577', '#C1DDE6'], // harbor
  ['#E8EEF6', '#3A4D68', '#D3DDEA'], // mist
  ['#D5E4FA', '#2F6BC4', '#BBD2F4'], // azure
]

export function paletteFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTES[h % PALETTES.length]
}

interface Props {
  recipe: Pick<Recipe, 'title' | 'category' | 'heroImage'>
  className?: string
  /** Size of the decorative type; "lg" for page heroes */
  size?: 'sm' | 'md' | 'lg'
  eager?: boolean
}

/** The recipe photo, or an editorial typographic cover when there isn't one. */
export function RecipeCover({ recipe, className = '', size = 'md', eager }: Props) {
  const [failed, setFailed] = useState(false)

  if (recipe.heroImage && !failed) {
    return (
      <img
        src={recipe.heroImage}
        alt={recipe.title}
        className={`${styles.img} ${className}`}
        loading={eager ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
      />
    )
  }

  const [bg, ink, accent] = paletteFor(recipe.title)
  const initial = recipe.title.trim().charAt(0).toUpperCase() || '·'

  return (
    <div
      className={`${styles.art} ${styles[size]} ${className}`}
      style={{ '--art-bg': bg, '--art-ink': ink, '--art-accent': accent } as React.CSSProperties}
      role="img"
      aria-label={recipe.title}
    >
      <span className={styles.letter} aria-hidden="true">{initial}</span>
      <span className={styles.mark} aria-hidden="true"><CategoryIcon category={recipe.category} strokeWidth={1.25} /></span>
    </div>
  )
}
