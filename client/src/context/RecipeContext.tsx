import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { Recipe } from '../types'
import { mockRecipes } from '../data/mockRecipes'
import { generateId, now } from '../utils/helpers'

const STORAGE_KEY = 'tates-recipes'

interface State {
  recipes: Recipe[]
}

type Action =
  | { type: 'ADD_RECIPE'; recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_RECIPE'; id: string; updates: Partial<Recipe> }
  | { type: 'DELETE_RECIPE'; id: string }
  | { type: 'TOGGLE_FAVORITE'; id: string }
  | { type: 'LOAD'; recipes: Recipe[] }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD':
      return { ...state, recipes: action.recipes }

    case 'ADD_RECIPE': {
      const recipe: Recipe = {
        ...action.recipe,
        id: generateId(),
        createdAt: now(),
        updatedAt: now(),
      }
      return { ...state, recipes: [recipe, ...state.recipes] }
    }

    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map((r) =>
          r.id === action.id ? { ...r, ...action.updates, updatedAt: now() } : r
        ),
      }

    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter((r) => r.id !== action.id),
      }

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
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateRecipe: (id: string, updates: Partial<Recipe>) => void
  deleteRecipe: (id: string) => void
  toggleFavorite: (id: string) => void
  getRecipe: (id: string) => Recipe | undefined
}

const RecipeContext = createContext<ContextValue | null>(null)

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { recipes: [] })

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        dispatch({ type: 'LOAD', recipes: JSON.parse(stored) })
      } catch {
        dispatch({ type: 'LOAD', recipes: mockRecipes })
      }
    } else {
      dispatch({ type: 'LOAD', recipes: mockRecipes })
    }
  }, [])

  useEffect(() => {
    if (state.recipes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recipes))
    }
  }, [state.recipes])

  const addRecipe = (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) =>
    dispatch({ type: 'ADD_RECIPE', recipe })

  const updateRecipe = (id: string, updates: Partial<Recipe>) =>
    dispatch({ type: 'UPDATE_RECIPE', id, updates })

  const deleteRecipe = (id: string) =>
    dispatch({ type: 'DELETE_RECIPE', id })

  const toggleFavorite = (id: string) =>
    dispatch({ type: 'TOGGLE_FAVORITE', id })

  const getRecipe = (id: string) =>
    state.recipes.find((r) => r.id === id)

  return (
    <RecipeContext.Provider
      value={{ recipes: state.recipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite, getRecipe }}
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
