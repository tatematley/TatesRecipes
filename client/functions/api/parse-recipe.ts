import { parseRecipe, isSignedIn, json } from '../../api-core/ai'
import type { Context } from '../../api-core/env'

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  if (!(await isSignedIn(request, env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY))) {
    return json({ error: 'Sign in as the admin to import recipes.' }, 401)
  }
  return parseRecipe(env.ANTHROPIC_API_KEY, await request.json().catch(() => null))
}
