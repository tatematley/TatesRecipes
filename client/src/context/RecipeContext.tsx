import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { Recipe } from '../types'
import { mockRecipes } from '../data/mockRecipes'
import {
  fetchRecipes, insertRecipe, patchRecipe, removeRecipe, seedIfEmpty,
} from '../lib/db'

interface State {
  recipes: Recipe[]
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'SET_LOADING' }
  | { type: 'SET_RECIPES'; recipes: Recipe[] }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'ADD'; recipe: Recipe }
  | { type: 'UPDATE'; id: string; recipe: Recipe }
  | { type: 'DELETE'; id: string }
  | { type: 'TOGGLE_FAVORITE'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null }
    case 'SET_RECIPES':
      return { ...state, recipes: action.recipes, loading: false, error: null }
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.message }
    case 'ADD':
      return { ...state, recipes: [action.recipe, ...state.recipes] }
    case 'UPDATE':
      return {
        ...state,
        recipes: state.recipes.map((r) => r.id === action.id ? action.recipe : r),
      }
    case 'DELETE':
      return { ...state, recipes: state.recipes.filter((r) => r.id !== action.id) }
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        recipes: state.recipes.map((r) =>
          r.id === action.id ? { ...r, isFavorite: !r.isFavorite } : r
        ),
      }
    default:
      return state
  }
}

interface ContextValue {
  recipes: Recipe[]
  loading: boolean
  error: string | null
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Recipe>
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  getRecipe: (id: string) => Recipe | undefined
  refreshRecipes: () => Promise<void>
}

const RecipeContext = createContext<ContextValue | null>(null)

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    recipes: [],
    loading: true,
    error: null,
  })

  const load = useCallback(async () => {
    dispatch({ type: 'SET_LOADING' })
    try {
      // On very first load, seed the mock recipes if the table is empty
      await seedIfEmpty(mockRecipes)
      const recipes = await fetchRecipes()
      dispatch({ type: 'SET_RECIPES', recipes })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load recipes'
      dispatch({ type: 'SET_ERROR', message: msg })
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addRecipe = useCallback(
    async (data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
      const recipe = await insertRecipe(data)
      dispatch({ type: 'ADD', recipe })
      return recipe
    },
    []
  )

  const updateRecipe = useCallback(async (id: string, updates: Partial<Recipe>) => {
    const recipe = await patchRecipe(id, updates)
    dispatch({ type: 'UPDATE', id, recipe })
  }, [])

  const deleteRecipe = useCallback(async (id: string) => {
    await removeRecipe(id)
    dispatch({ type: 'DELETE', id })
  }, [])

  const toggleFavorite = useCallback(async (id: string) => {
    const recipe = state.recipes.find((r) => r.id === id)
    if (!recipe) return
    // Optimistic update — flip immediately, sync in background
    dispatch({ type: 'TOGGLE_FAVORITE', id })
    try {
      await patchRecipe(id, { isFavorite: !recipe.isFavorite })
    } catch {
      // Revert on failure
      dispatch({ type: 'TOGGLE_FAVORITE', id })
    }
  }, [state.recipes])

  const getRecipe = useCallback(
    (id: string) => state.recipes.find((r) => r.id === id),
    [state.recipes]
  )

  return (
    <RecipeContext.Provider
      value={{
        recipes:        state.recipes,
        loading:        state.loading,
        error:          state.error,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleFavorite,
        getRecipe,
        refreshRecipes: load,
      }}
    >
      {children}
    </RecipeContext.Provider>
  )
}

export function useRecipeContext(): ContextValue {
  const ctx = useContext(RecipeContext)
  if (!ctx) throw new Error('useRecipeContext must be used within RecipeProvider')
  return ctx
}
