import { useEffect, useState } from 'react'
import { Recipe } from '../types'
import { UnitSystem } from '../utils/quantity'

/**
 * Servings + unit choice for one recipe, shared between the recipe page
 * and cook mode (kept for the browser session).
 */
export function useRecipeScale(recipe: Recipe | undefined) {
  const key = recipe ? `tt:scale:${recipe.id}` : ''
  const base = recipe?.servings ?? null

  const [state, setState] = useState<{ servings: number | null; factor: number; units: UnitSystem }>(() => read(key, base))

  useEffect(() => { setState(read(key, base)) }, [key, base])
  useEffect(() => {
    if (!key) return
    try { sessionStorage.setItem(key, JSON.stringify(state)) } catch { /* ignore */ }
  }, [key, state])

  return {
    servings: state.servings,
    factor: state.factor,
    units: state.units,
    setServings: (n: number) => {
      const s = Math.max(1, Math.min(99, n))
      setState((st) => ({ ...st, servings: s, factor: base ? s / base : st.factor }))
    },
    /** For recipes without a serving count */
    setFactor: (f: number) => setState((st) => ({ ...st, factor: Math.max(0.25, Math.min(10, f)) })),
    setUnits: (units: UnitSystem) => setState((st) => ({ ...st, units })),
    reset: () => setState({ servings: base, factor: 1, units: 'original' }),
  }
}

function read(key: string, base: number | null) {
  const fallback = { servings: base, factor: 1, units: 'original' as UnitSystem }
  if (!key) return fallback
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) return { ...fallback, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return fallback
}
