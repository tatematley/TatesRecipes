import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Demo mode: with no Supabase credentials the app still runs, backed by
 * sample recipes stored in this browser. Handy for previews and design work.
 */
export const isDemo = !url || !key

export const supabase: SupabaseClient | null = isDemo ? null : createClient(url!, key!)

export const PHOTOS_BUCKET = 'recipe-photos'
