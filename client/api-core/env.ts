/** Cloudflare Pages settings → Variables and Secrets, available to every function. */
export interface Env {
  ANTHROPIC_API_KEY?: string
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
}

export interface Context {
  request: Request
  env: Env
}
