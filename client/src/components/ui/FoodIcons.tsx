import type { ComponentType } from 'react'
import {
  BookOpenIcon, ChefHatIcon, ClockIcon, FlameIcon, HeartIcon, HomeIcon, LeafIcon,
  PencilIcon, SparkleIcon, StarIcon,
} from './Icons'

/** Line icons for food, aisles and collections, drawn to match Icons.tsx. */

interface IconProps { size?: number; strokeWidth?: number; className?: string }
type Icon = ComponentType<IconProps>

const svg = (children: React.ReactNode) =>
  function FoodIcon({ size = 16, strokeWidth = 1.5, className }: IconProps) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {children}
      </svg>
    )
  }

export const UtensilsIcon = svg(<><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></>)
export const CoffeeIcon = svg(<><path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><path d="M6 2v2M10 2v2M14 2v2" /></>)
export const SandwichIcon = svg(<><path d="M3 11 12 5l9 6" /><path d="M3 11h18" /><path d="M4 15h16" /><path d="M5 19h14a1 1 0 0 0 1-1v-3H4v3a1 1 0 0 0 1 1z" /></>)
export const SoupIcon = svg(<><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" /><path d="M7 21h10" /><path d="M8 3c.5.6.5 1.4 0 2s-.5 1.4 0 2" /><path d="M12 3c.5.6.5 1.4 0 2s-.5 1.4 0 2" /><path d="M16 3c.5.6.5 1.4 0 2s-.5 1.4 0 2" /></>)
export const SaladIcon = svg(<><path d="M7 21h10" /><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" /><path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.5 2.5 0 0 1 .03 1.1" /><path d="m13 12 4-4" /><path d="M10.9 7.25A4 4 0 0 0 4 10c0 .73.2 1.41.54 2" /></>)
export const CookieIcon = svg(<><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01" /></>)
export const WheatIcon = svg(<><path d="M2 22 16 8" /><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" /></>)
export const CarrotIcon = svg(<><path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7z" /><path d="M8.64 14l-2.05-2.04M15.34 15l-2.46-2.46" /><path d="M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9z" /><path d="M15 2s-2 1.33-2 3.5S15 9 15 9s2-1.84 2-3.5C17 3.33 15 2 15 2z" /></>)
export const OliveIcon = svg(<><ellipse cx="9.5" cy="14.5" rx="5.5" ry="6.5" transform="rotate(-30 9.5 14.5)" /><path d="M13 9 20 2" /><circle cx="9.5" cy="14.5" r="1.5" /></>)
export const AppleIcon = svg(<><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.78 4.78 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" /><path d="M10 2c1 .5 2 2 2 5" /></>)
export const GlassIcon = svg(<><path d="M8 22h8" /><path d="M7 10h10" /><path d="M12 15v7" /><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" /></>)
export const JarIcon = svg(<><path d="M8 2h8" /><path d="M7 5h10" /><path d="M7 5v14a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V5" /><path d="M7 12h10" /></>)
export const GiftIcon = svg(<><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" /></>)
export const EggIcon = svg(<path d="M12 22c6.23-.05 7.87-5.57 7.5-10-.36-4.34-3.95-9.96-7.5-10-3.55.04-7.14 5.66-7.5 10-.37 4.43 1.27 9.95 7.5 10z" />)
export const DrumstickIcon = svg(<><path d="M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23" /><path d="m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59" /></>)
export const SnowflakeIcon = svg(<><path d="M2 12h20M12 2v20" /><path d="m20 16-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4" /></>)
export const CartIcon = svg(<><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></>)
export const TreeIcon = svg(<><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z" /><path d="M12 22v-3" /></>)
export const BasketIcon = svg(<><path d="m15 11-1 9M19 11l-4-7M2 11h20M3.5 11l1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4M4.5 15.5h15M5 11l4-7M9 11l1 9" /></>)
export const ShakerIcon = svg(<><path d="M8 9h8l1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /><path d="M11 4.5h.01M13 4.5h.01" /></>)
export const VolumeIcon = svg(<><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>)
export const StopIcon = svg(<rect x="6" y="6" width="12" height="12" rx="1.5" />)
export const PartyIcon = svg(<><path d="M5.8 11.3 2 22l10.7-3.79" /><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01" /><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" /><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11-.11.7-.72 1.22-1.43 1.22H17" /><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98-.7.1-1.22.72-1.22 1.43V7" /><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" /></>)

/* ── Lookups ─────────────────────────────────────────── */

const CATEGORY_ICONS: Record<string, Icon> = {
  Breakfast: CoffeeIcon, Lunch: SandwichIcon, Dinner: UtensilsIcon, Desserts: CookieIcon,
  Breads: WheatIcon, Sides: CarrotIcon, Appetizers: OliveIcon, Soups: SoupIcon, Salads: SaladIcon,
  Snacks: AppleIcon, Drinks: GlassIcon, Sauces: JarIcon, 'Holiday Recipes': GiftIcon, 'Family Favorites': HomeIcon,
}

export function CategoryIcon({ category, ...props }: IconProps & { category: string }) {
  const I = CATEGORY_ICONS[category] ?? UtensilsIcon
  return <I {...props} />
}

const AISLE_ICONS: Record<string, Icon> = {
  Produce: CarrotIcon, 'Meat & Seafood': DrumstickIcon, 'Dairy & Eggs': EggIcon, Bakery: WheatIcon,
  Pantry: JarIcon, 'Spices & Baking': ShakerIcon, Frozen: SnowflakeIcon, Drinks: GlassIcon, Other: CartIcon,
  __own: PencilIcon, __recipe: BookOpenIcon,
}

export function AisleIcon({ aisle, ...props }: IconProps & { aisle: string }) {
  const I = AISLE_ICONS[aisle] ?? CartIcon
  return <I {...props} />
}

/** Icons a collection can wear. Keys are stored on the collection. */
export const COLLECTION_ICONS: Record<string, Icon> = {
  book: BookOpenIcon, utensils: UtensilsIcon, soup: SoupIcon, salad: SaladIcon, cookie: CookieIcon,
  wheat: WheatIcon, coffee: CoffeeIcon, flame: FlameIcon, tree: TreeIcon, gift: GiftIcon, leaf: LeafIcon,
  glass: GlassIcon, heart: HeartIcon, star: StarIcon, home: HomeIcon, snowflake: SnowflakeIcon,
  clock: ClockIcon, chef: ChefHatIcon, sparkle: SparkleIcon,
}
export const COLLECTION_ICON_KEYS = ['book', 'utensils', 'soup', 'salad', 'cookie', 'wheat', 'coffee', 'flame', 'tree', 'gift', 'leaf', 'glass', 'heart', 'star', 'home', 'snowflake']
export const DEFAULT_COLLECTION_ICON = 'book'

/** Older collections stored an emoji here; anything unknown shows the book. */
export function CollectionIcon({ icon, ...props }: IconProps & { icon?: string }) {
  const I = (icon && COLLECTION_ICONS[icon]) || BookOpenIcon
  return <I {...props} />
}
