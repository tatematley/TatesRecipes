import { supabase, PHOTOS_BUCKET } from './supabase'
import { Recipe, Ingredient, Instruction, Photo, Category, Difficulty, Measurement } from '../types'

// ─── DB Row Shape (snake_case from Postgres) ─────────────────
interface DBRecipe {
  id: string
  title: string
  description: string
  category: string
  prep_time: number | null
  cook_time: number | null
  total_time: number | null
  servings: number | null
  difficulty: string | null
  hero_image: string
  source_url: string
  source_name: string
  created_by_tate: boolean
  tates_tips: string
  is_favorite: boolean
  tags: string[]
  ingredients: Ingredient[]
  instructions: Instruction[]
  photos: Photo[]
  created_at: string
  updated_at: string
}

// ─── Mappers ─────────────────────────────────────────────────
function toRecipe(row: DBRecipe): Recipe {
  return {
    id:            row.id,
    title:         row.title,
    description:   row.description,
    category:      row.category as Category,
    prepTime:      row.prep_time,
    cookTime:      row.cook_time,
    totalTime:     row.total_time,
    servings:      row.servings,
    difficulty:    row.difficulty as Difficulty | null,
    heroImage:     row.hero_image,
    sourceUrl:     row.source_url,
    sourceName:    row.source_name,
    createdByTate: row.created_by_tate,
    tatesTips:     row.tates_tips,
    isFavorite:    row.is_favorite,
    tags:          row.tags ?? [],
    ingredients:   row.ingredients ?? [],
    instructions:  row.instructions ?? [],
    photos:        row.photos ?? [],
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  }
}

function toRow(r: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Omit<DBRecipe, 'id' | 'created_at' | 'updated_at'> {
  return {
    title:           r.title,
    description:     r.description,
    category:        r.category,
    prep_time:       r.prepTime,
    cook_time:       r.cookTime,
    total_time:      r.totalTime,
    servings:        r.servings,
    difficulty:      r.difficulty,
    hero_image:      r.heroImage,
    source_url:      r.sourceUrl ?? '',
    source_name:     r.sourceName ?? '',
    created_by_tate: r.createdByTate,
    tates_tips:      r.tatesTips,
    is_favorite:     r.isFavorite,
    tags:            r.tags,
    ingredients:     r.ingredients,
    instructions:    r.instructions,
    photos:          r.photos,
  }
}

// ─── CRUD ─────────────────────────────────────────────────────
export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as DBRecipe[]).map(toRecipe)
}

export async function insertRecipe(
  recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert(toRow(recipe))
    .select()
    .single()

  if (error) throw error
  return toRecipe(data as DBRecipe)
}

export async function patchRecipe(
  id: string,
  updates: Partial<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Recipe> {
  // Build only the columns that are being updated
  const patch: Partial<DBRecipe> = {}
  if (updates.title          !== undefined) patch.title           = updates.title
  if (updates.description    !== undefined) patch.description     = updates.description
  if (updates.category       !== undefined) patch.category        = updates.category
  if (updates.prepTime       !== undefined) patch.prep_time       = updates.prepTime
  if (updates.cookTime       !== undefined) patch.cook_time       = updates.cookTime
  if (updates.totalTime      !== undefined) patch.total_time      = updates.totalTime
  if (updates.servings       !== undefined) patch.servings        = updates.servings
  if (updates.difficulty     !== undefined) patch.difficulty      = updates.difficulty
  if (updates.heroImage      !== undefined) patch.hero_image      = updates.heroImage
  if (updates.sourceUrl      !== undefined) patch.source_url      = updates.sourceUrl
  if (updates.sourceName     !== undefined) patch.source_name     = updates.sourceName
  if (updates.createdByTate  !== undefined) patch.created_by_tate = updates.createdByTate
  if (updates.tatesTips      !== undefined) patch.tates_tips      = updates.tatesTips
  if (updates.isFavorite     !== undefined) patch.is_favorite     = updates.isFavorite
  if (updates.tags           !== undefined) patch.tags            = updates.tags
  if (updates.ingredients    !== undefined) patch.ingredients     = updates.ingredients
  if (updates.instructions   !== undefined) patch.instructions    = updates.instructions
  if (updates.photos         !== undefined) patch.photos          = updates.photos

  const { data, error } = await supabase
    .from('recipes')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toRecipe(data as DBRecipe)
}

export async function removeRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Photo Upload ─────────────────────────────────────────────
export async function uploadPhoto(folderId: string, file: File): Promise<string> {
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${folderId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, { upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from(PHOTOS_BUCKET)
    .getPublicUrl(path)

  return data.publicUrl
}

// ─── Ingredient / Instruction helpers (used in JSONB data) ───
export function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: crypto.randomUUID(),
    quantity: '',
    measurement: '' as Measurement,
    name: '',
    preparation: '',
    order: 0,
    ...overrides,
  }
}

export function makeInstruction(overrides: Partial<Instruction> = {}): Instruction {
  return {
    id: crypto.randomUUID(),
    step: 1,
    text: '',
    ...overrides,
  }
}
