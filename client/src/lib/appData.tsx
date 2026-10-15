import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, isDemo } from './supabase'
import { Collection, CookEntry, GroceryItem, PlanEntry, Recipe } from '../types'
import { combineIngredients } from '../utils/quantity'

/**
 * Kitchen data that lives beside the recipes: collections, the meal plan,
 * the grocery list, the cook log and recently viewed recipes.
 *
 * Saved instantly to this browser, and synced to Supabase's `app_state`
 * table when it exists (see supabase/schema.sql). Without that table the
 * app keeps working and the data simply stays on this device.
 */

interface KitchenState {
  collections: Collection[]
  plan: PlanEntry[]
  grocery: GroceryItem[]
  cookLog: CookEntry[]
  recent: string[]
}

const EMPTY: KitchenState = { collections: [], plan: [], grocery: [], cookLog: [], recent: [] }
const KEYS = Object.keys(EMPTY) as (keyof KitchenState)[]
const LS_PREFIX = 'tt:kitchen:'

export type SyncStatus = 'local' | 'syncing' | 'synced'

function readLocal(): KitchenState {
  const state = { ...EMPTY }
  for (const k of KEYS) {
    try {
      const raw = localStorage.getItem(LS_PREFIX + k)
      if (raw) (state as Record<string, unknown>)[k] = JSON.parse(raw)
    } catch { /* ignore */ }
  }
  return state
}

const uid = () => crypto.randomUUID()
export const todayISO = () => toISODate(new Date())
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface AppDataValue extends KitchenState {
  syncStatus: SyncStatus

  // Collections
  createCollection: (input: { name: string; emoji?: string; description?: string; recipeIds?: string[] }) => Collection
  updateCollection: (id: string, patch: Partial<Omit<Collection, 'id' | 'createdAt'>>) => void
  deleteCollection: (id: string) => void
  toggleInCollection: (collectionId: string, recipeId: string) => void

  // Meal plan
  addToPlan: (input: { date: string; recipeId: string; meal?: PlanEntry['meal']; servings?: number | null }) => void
  removeFromPlan: (entryId: string) => void
  movePlanEntry: (entryId: string, date: string) => void

  // Grocery
  addRecipesToGrocery: (items: { recipe: Recipe; factor?: number }[]) => number
  addGroceryItem: (name: string, amount?: string, aisle?: string) => void
  toggleGroceryItem: (id: string) => void
  updateGroceryItem: (id: string, patch: Partial<GroceryItem>) => void
  removeGroceryItem: (id: string) => void
  clearCheckedGrocery: () => void
  clearGrocery: () => void

  // Cook log
  logCook: (input: Omit<CookEntry, 'id'>) => void
  removeCookEntry: (id: string) => void
  cooksFor: (recipeId: string) => CookEntry[]

  // Recently viewed
  markViewed: (recipeId: string) => void

  // Housekeeping when a recipe is deleted
  forgetRecipe: (recipeId: string) => void
}

const Ctx = createContext<AppDataValue | null>(null)

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<KitchenState>(readLocal)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local')
  const remoteOk = useRef(false)
  const dirty = useRef(new Set<keyof KitchenState>())
  const timer = useRef<number | null>(null)

  // Pull from Supabase once. A missing table just means "local only".
  useEffect(() => {
    if (isDemo || !supabase) return
    let cancelled = false
    setSyncStatus('syncing')
    supabase
      .from('app_state')
      .select('key, value')
      .in('key', KEYS)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { setSyncStatus('local'); return }
        remoteOk.current = true
        setSyncStatus('synced')
        if (data && data.length) {
          setState((s) => {
            const next = { ...s }
            for (const row of data as { key: keyof KitchenState; value: unknown }[]) {
              if (KEYS.includes(row.key)) (next as Record<string, unknown>)[row.key] = row.value
            }
            return next
          })
        }
      })
    return () => { cancelled = true }
  }, [])

  const flush = useCallback((snapshot: KitchenState) => {
    for (const k of KEYS) {
      try { localStorage.setItem(LS_PREFIX + k, JSON.stringify(snapshot[k])) } catch { /* ignore */ }
    }
    if (!remoteOk.current || !supabase || dirty.current.size === 0) return
    const rows = [...dirty.current].map((key) => ({ key, value: snapshot[key], updated_at: new Date().toISOString() }))
    dirty.current.clear()
    setSyncStatus('syncing')
    supabase.from('app_state').upsert(rows).then(({ error }) => setSyncStatus(error ? 'local' : 'synced'))
  }, [])

  const latest = useRef(state)
  latest.current = state

  // Persist on every change; remote writes are debounced.
  useEffect(() => {
    for (const k of KEYS) {
      try { localStorage.setItem(LS_PREFIX + k, JSON.stringify(state[k])) } catch { /* ignore */ }
    }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => flush(latest.current), 600)
  }, [state, flush])

  const update = useCallback(<K extends keyof KitchenState>(key: K, fn: (v: KitchenState[K]) => KitchenState[K]) => {
    dirty.current.add(key)
    setState((s) => ({ ...s, [key]: fn(s[key]) }))
  }, [])

  const value = useMemo<AppDataValue>(() => ({
    ...state,
    syncStatus,

    createCollection: ({ name, emoji = 'book', description = '', recipeIds = [] }) => {
      const c: Collection = { id: uid(), name, emoji, description, recipeIds, createdAt: new Date().toISOString() }
      update('collections', (cs) => [...cs, c])
      return c
    },
    updateCollection: (id, patch) => update('collections', (cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    deleteCollection: (id) => update('collections', (cs) => cs.filter((c) => c.id !== id)),
    toggleInCollection: (collectionId, recipeId) =>
      update('collections', (cs) => cs.map((c) => c.id !== collectionId ? c : {
        ...c,
        recipeIds: c.recipeIds.includes(recipeId) ? c.recipeIds.filter((r) => r !== recipeId) : [...c.recipeIds, recipeId],
      })),

    addToPlan: ({ date, recipeId, meal = 'Dinner', servings = null }) =>
      update('plan', (p) => [...p, { id: uid(), date, recipeId, meal, servings }]),
    removeFromPlan: (entryId) => update('plan', (p) => p.filter((e) => e.id !== entryId)),
    movePlanEntry: (entryId, date) => update('plan', (p) => p.map((e) => (e.id === entryId ? { ...e, date } : e))),

    addRecipesToGrocery: (items) => {
      const lines = combineIngredients(items.map(({ recipe, factor = 1 }) => ({ recipeId: recipe.id, ingredients: recipe.ingredients, factor })))
      update('grocery', (g) => {
        const next = g.map((x) => ({ ...x }))
        for (const line of lines) {
          const amount = line.amounts.join(' + ')
          const existing = next.find((x) => !x.checked && x.name.toLowerCase() === line.name.toLowerCase())
          if (existing) {
            existing.amount = [existing.amount, amount].filter(Boolean).join(' + ')
            existing.recipeIds = [...new Set([...existing.recipeIds, ...line.recipeIds])]
          } else {
            next.push({ id: uid(), name: line.name, amount, aisle: line.aisle, checked: false, recipeIds: line.recipeIds, addedAt: new Date().toISOString() })
          }
        }
        return next
      })
      return lines.length
    },
    addGroceryItem: (name, amount = '', aisle) =>
      update('grocery', (g) => [...g, { id: uid(), name, amount, aisle: aisle ?? 'Other', checked: false, recipeIds: [], addedAt: new Date().toISOString() }]),
    toggleGroceryItem: (id) => update('grocery', (g) => g.map((x) => (x.id === id ? { ...x, checked: !x.checked } : x))),
    updateGroceryItem: (id, patch) => update('grocery', (g) => g.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    removeGroceryItem: (id) => update('grocery', (g) => g.filter((x) => x.id !== id)),
    clearCheckedGrocery: () => update('grocery', (g) => g.filter((x) => !x.checked)),
    clearGrocery: () => update('grocery', () => []),

    logCook: (input) => update('cookLog', (l) => [{ ...input, id: uid() }, ...l]),
    removeCookEntry: (id) => update('cookLog', (l) => l.filter((e) => e.id !== id)),
    cooksFor: (recipeId) => state.cookLog.filter((e) => e.recipeId === recipeId).sort((a, b) => b.date.localeCompare(a.date)),

    markViewed: (recipeId) => update('recent', (r) => [recipeId, ...r.filter((x) => x !== recipeId)].slice(0, 12)),

    forgetRecipe: (recipeId) => {
      update('collections', (cs) => cs.map((c) => ({ ...c, recipeIds: c.recipeIds.filter((r) => r !== recipeId) })))
      update('plan', (p) => p.filter((e) => e.recipeId !== recipeId))
      update('recent', (r) => r.filter((x) => x !== recipeId))
    },
  }), [state, syncStatus, update])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppData(): AppDataValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
