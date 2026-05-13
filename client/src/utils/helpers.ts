import { Recipe, FilterState } from '../types'

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function formatTime(minutes: number | null): string {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

export function now(): string {
  return new Date().toISOString()
}

export function applyFilters(recipes: Recipe[], filters: FilterState): Recipe[] {
  return recipes.filter((recipe) => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const inTitle = recipe.title.toLowerCase().includes(q)
      const inDesc = recipe.description.toLowerCase().includes(q)
      const inTags = recipe.tags.some((t) => t.toLowerCase().includes(q))
      const inIngredients = recipe.ingredients.some((i) =>
        i.name.toLowerCase().includes(q)
      )
      if (!inTitle && !inDesc && !inTags && !inIngredients) return false
    }

    if (filters.category && filters.category !== 'All') {
      if (recipe.category !== filters.category) return false
    }

    if (filters.timeFilter) {
      const total = recipe.totalTime
      switch (filters.timeFilter) {
        case 'under15':
          if (!total || total >= 15) return false
          break
        case 'under30':
          if (!total || total >= 30) return false
          break
        case 'under60':
          if (!total || total >= 60) return false
          break
        case 'over60':
          if (!total || total <= 60) return false
          break
      }
    }

    if (filters.dietaryTags.length > 0) {
      if (!filters.dietaryTags.every((tag) => recipe.tags.includes(tag)))
        return false
    }

    if (filters.occasionTags.length > 0) {
      if (!filters.occasionTags.every((tag) => recipe.tags.includes(tag)))
        return false
    }

    if (filters.difficulty) {
      if (recipe.difficulty !== filters.difficulty) return false
    }

    if (filters.favoritesOnly && !recipe.isFavorite) return false
    if (filters.createdByTateOnly && !recipe.createdByTate) return false

    return true
  })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function getTagColor(tag: string): string {
  const dietary = ['Gluten Free', 'Dairy Free', 'Vegetarian', 'Vegan', 'Nut Free', 'High Protein', 'Low Sugar']
  const occasion = ['Weeknight Dinner', 'Sunday Dinner', 'BBQ', 'Holiday', 'Party', 'Cozy Meal']
  if (dietary.includes(tag)) return 'dietary'
  if (occasion.includes(tag)) return 'occasion'
  if (tag === 'Family Favorite') return 'family'
  if (tag === 'Crowd Pleaser' || tag === 'Worth the Effort') return 'special'
  return 'default'
}
