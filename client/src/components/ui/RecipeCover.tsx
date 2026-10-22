import { useState } from 'react'
import { Recipe } from '../../types'
import { CategoryIcon } from './FoodIcons'
import styles from './RecipeCover.module.css'

/** Curated palettes for recipes without a photo: [background, ink] */
const PALETTES: [string, string, string][] = [
  ['#E3EEFC', '#1B2E4F', '#D0E1F8'], // elite on horizon
  ['#DDEAFB', '#3B63A3', '#C8DBF6'], // international
  ['#EAF4FE', '#3B63A3', '#D5E9FC'], // endless horizon
  ['#E1EBF9', '#2C4A7E', '#CBDBF2'], // greek sea
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

/** The recipe photo, or its title (an icon at small and hero sizes) when there isn't one. */
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

  return (
    <div
      className={`${styles.art} ${styles[size]} ${className}`}
      style={{ '--art-bg': bg, '--art-ink': ink, '--art-accent': accent } as React.CSSProperties}
      role="img"
      aria-label={recipe.title}
    >
      {size === 'md' ? (
        <span className={styles.title} aria-hidden="true">{recipe.title}</span>
      ) : (
        <span className={styles.mark} aria-hidden="true"><CategoryIcon category={recipe.category} strokeWidth={1.25} /></span>
      )}
    </div>
  )
}
