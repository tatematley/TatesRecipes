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

/** Headers proving the admin is signed in, for the AI endpoints. */
export async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}
}
