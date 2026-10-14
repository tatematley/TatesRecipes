import { useState } from 'react'
import { Recipe } from '../../types'
import styles from './RecipeCover.module.css'

/** Curated palettes for recipes without a photo: [background, ink] */
const PALETTES: [string, string, string][] = [
  ['#DCE5CF', '#3F6B3A', '#C7D6B6'], // sage
  ['#F3D9CB', '#A9492A', '#ECC3AE'], // terracotta
  ['#F5E3BC', '#9A6612', '#EDD39C'], // saffron
  ['#E7D5DE', '#8A3557', '#DBBFCD'], // plum
  ['#D6E0E6', '#2F5671', '#C1D1DB'], // slate
  ['#E8E1D3', '#5F513F', '#DAD0BD'], // oat
  ['#D9E6E0', '#2E6455', '#C2D8CE'], // eucalyptus
]

const CATEGORY_EMOJI: Record<string, string> = {
  Breakfast: '🥞', Lunch: '🥪', Dinner: '🍲', Desserts: '🍪', Breads: '🍞', Sides: '🥔',
  Appetizers: '🫒', Soups: '🥣', Salads: '🥗', Snacks: '🥨', Drinks: '🍹', Sauces: '🫙',
  'Holiday Recipes': '🥧', 'Family Favorites': '🏡',
}

export function paletteFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTES[h % PALETTES.length]
}

export function categoryEmoji(category: string) {
  return CATEGORY_EMOJI[category] ?? '🍽️'
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
      <span className={styles.emoji} aria-hidden="true">{categoryEmoji(recipe.category)}</span>
    </div>
  )
}
