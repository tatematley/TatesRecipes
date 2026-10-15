import { useState } from 'react'
import { Recipe } from '../../types'
import { CategoryIcon } from './FoodIcons'
import styles from './RecipeCover.module.css'

/** Curated palettes for recipes without a photo: [background, ink] */
const PALETTES: [string, string, string][] = [
  ['#E6E3D0', '#5E5A36', '#D7D2B6'], // golden matcha
  ['#F3DFCF', '#A3582C', '#EACBB2'], // citrus spice
  ['#DDE0D8', '#2A302B', '#CACFC5'], // forest mist
  ['#EEE8DC', '#6A5E46', '#E1D9C8'], // pearl oatmilk
  ['#E9E5CF', '#77703F', '#DBD5B6'], // matcha cream
  ['#F5E4D6', '#B8653A', '#EDD0BA'], // apricot
  ['#D9DCD3', '#3D473E', '#C4CABF'], // sage forest
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
