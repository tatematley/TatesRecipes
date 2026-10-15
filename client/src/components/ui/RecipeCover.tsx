import { useState } from 'react'
import { Recipe } from '../../types'
import { CategoryIcon } from './FoodIcons'
import styles from './RecipeCover.module.css'

/** Curated palettes for recipes without a photo: [background, ink] */
const PALETTES: [string, string, string][] = [
  ['#E4EAE3', '#2A302B', '#D2DBD0'], // forest mist
  ['#F6E1D2', '#A3582C', '#EDCDB6'], // citrus spice
  ['#E8ECE7', '#3D473E', '#D7DED5'], // sage
  ['#EEF0ED', '#4A524B', '#DFE3DE'], // stone
  ['#DDE6DC', '#2F4A33', '#C9D6C7'], // fern
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
