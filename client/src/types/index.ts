export type Difficulty = 'easy' | 'medium' | 'advanced'

export type Category =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Desserts'
  | 'Breads'
  | 'Sides'
  | 'Appetizers'
  | 'Soups'
  | 'Salads'
  | 'Snacks'
  | 'Drinks'
  | 'Sauces'
  | 'Holiday Recipes'
  | 'Family Favorites'

export type Measurement =
  | ''
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'oz'
  | 'fl oz'
  | 'pint'
  | 'quart'
  | 'gallon'
  | 'g'
  | 'kg'
  | 'lb'
  | 'pinch'
  | 'dash'
  | 'clove'
  | 'can'
  | 'package'
  | 'stick'
  | 'whole'
  | 'slice'
  | 'piece'

export interface Ingredient {
  id: string
  quantity: string
  measurement: Measurement
  name: string
  preparation: string
  order: number
  group?: string
}

export interface Instruction {
  id: string
  step: number
  text: string
}

export interface Photo {
  id: string
  url: string
  caption?: string
  dateMade?: string
  notes?: string
  rating?: number
  whatChanged?: string
  makeAgain?: boolean
}

export interface Recipe {
  id: string
  title: string
  description: string
  category: Category
  prepTime: number | null
  cookTime: number | null
  totalTime: number | null
  servings: number | null
  difficulty: Difficulty | null
  heroImage: string
  sourceUrl?: string
  sourceName?: string
  createdByTate: boolean
  tatesTips: string
  tags: string[]
  ingredients: Ingredient[]
  instructions: Instruction[]
  photos: Photo[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export interface FilterState {
  search: string
  category: string
  timeFilter: string
  dietaryTags: string[]
  occasionTags: string[]
  difficulty: string
  favoritesOnly: boolean
  createdByTateOnly: boolean
}

export const ALL_DIETARY_TAGS = [
  'Gluten Free',
  'Dairy Free',
  'Vegetarian',
  'Vegan',
  'Nut Free',
  'High Protein',
  'Low Sugar',
] as const

export const ALL_OCCASION_TAGS = [
  'Weeknight Dinner',
  'Sunday Dinner',
  'BBQ',
  'Party',
  'Cozy Meal',
] as const

export const ALL_HOLIDAY_TAGS = [
  'Christmas',
  'Thanksgiving',
  'Easter',
  '4th of July',
  'Halloween',
  'New Year\'s Eve',
  'Valentine\'s Day',
  'Mother\'s Day',
  'Father\'s Day',
  'St. Patrick\'s Day',
] as const

export const ALL_CUSTOM_TAGS = [
  'Devyn',
  'Family Favorite',
  'Quick',
  'Comfort Food',
  'Fancy',
  'Cozy',
  'Summer',
  'BBQ',
  'Meal Prep',
  'Crowd Pleaser',
  'Easy',
  'Worth the Effort',
] as const

export const ALL_CATEGORIES: Category[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Desserts',
  'Breads',
  'Sides',
  'Appetizers',
  'Soups',
  'Salads',
  'Snacks',
  'Drinks',
  'Sauces',
  'Holiday Recipes',
  'Family Favorites',
]

export const MEASUREMENTS: Measurement[] = [
  '',
  'tsp',
  'tbsp',
  'cup',
  'oz',
  'fl oz',
  'pint',
  'quart',
  'gallon',
  'g',
  'kg',
  'lb',
  'pinch',
  'dash',
  'clove',
  'can',
  'package',
  'stick',
  'whole',
  'slice',
  'piece',
]
