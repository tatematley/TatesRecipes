import { Recipe } from '../types'

/**
 * Ranked search across titles, tags, ingredients and descriptions.
 * Every word must match somewhere; title hits rank highest.
 * With no query, favorites and newest come first.
 */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) {
    return [...recipes].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || b.createdAt.localeCompare(a.createdAt))
  }
  const scored: { r: Recipe; score: number }[] = []
  for (const r of recipes) {
    const title = r.title.toLowerCase()
    const tags = r.tags.join(' ').toLowerCase()
    const ings = r.ingredients.map((i) => i.name).join(' ').toLowerCase()
    const rest = `${r.description} ${r.category} ${r.sourceName ?? ''} ${r.tatesTips}`.toLowerCase()
    let score = 0
    let all = true
    for (const w of words) {
      if (title.startsWith(w)) score += 12
      else if (new RegExp(`\\b${escape(w)}`).test(title)) score += 8
      else if (title.includes(w)) score += 5
      else if (tags.includes(w)) score += 4
      else if (ings.includes(w)) score += 3
      else if (rest.includes(w)) score += 1
      else { all = false; break }
    }
    if (all) scored.push({ r, score: score + (r.isFavorite ? 0.5 : 0) })
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.r)
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
