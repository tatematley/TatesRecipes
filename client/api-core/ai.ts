/**
 * The AI features — recipe import and the kitchen assistant — shared by the
 * Cloudflare Pages Functions (client/functions/api) and the local Express
 * server (server/src/index.ts). Request body in, Response out.
 *
 * Talks to the Anthropic Messages API with plain fetch (the SDK needs Node
 * modules Cloudflare doesn't have), streaming so long replies don't time out.
 */

const MODEL = 'claude-opus-5-5'
const FALLBACK_BETA = 'server-side-fallback-2026-07-01'
const MISSING_KEY = 'The Anthropic API key isn’t set up for the AI features yet'
const REFUSAL_TEXT = "Sorry, I can't help with that one. Try asking about something else from the kitchen!"

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

/** Turn API errors into a short, human message the UI can show. */
function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.'
    if (err.status === 403) return 'This API key does not have access to that model.'
    if (err.status === 429 || err.status === 529) return 'The assistant is a bit busy right now. Try again in a moment.'
    if (err.status === 400) return `The request was rejected: ${err.message}`
    if (err.status >= 500) return 'The Anthropic API had a hiccup. Try again in a moment.'
    return `Anthropic API error (${err.status}): ${err.message}`
  }
  return err instanceof Error ? err.message : 'Something went wrong'
}

type Content = string | ({ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } })[]

interface MessageParams {
  max_tokens: number
  effort: 'low' | 'medium'
  system?: { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }[]
  messages: { role: 'user' | 'assistant'; content: Content }[]
}

/**
 * Streams one Messages API call, calling onText for each piece of text.
 * Resolves with the full text and why the model stopped.
 */
async function streamMessage(apiKey: string, params: MessageParams, onText?: (text: string) => void, signal?: AbortSignal) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': FALLBACK_BETA,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: params.max_tokens,
      output_config: { effort: params.effort },
      fallbacks: 'default',
      stream: true,
      ...(params.system ? { system: params.system } : {}),
      messages: params.messages,
    }),
  })
  if (!res.ok || !res.body) {
    const detail = await res.json().catch(() => null) as { error?: { message?: string } } | null
    throw new ApiError(res.status, detail?.error?.message ?? res.statusText)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  let stopReason: string | null = null
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let split: number
    while ((split = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, split)
      buffer = buffer.slice(split + 2)
      const data = block.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('')
      if (!data) continue
      const event = JSON.parse(data) as {
        type: string
        delta?: { type?: string; text?: string; stop_reason?: string }
        error?: { type?: string; message?: string }
      }
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta' && event.delta.text) {
        text += event.delta.text
        onText?.(event.delta.text)
      } else if (event.type === 'message_delta' && event.delta?.stop_reason) {
        stopReason = event.delta.stop_reason
      } else if (event.type === 'error') {
        throw new ApiError(event.error?.type === 'overloaded_error' ? 529 : 500, event.error?.message ?? 'Stream error')
      }
    }
  }
  return { text, stopReason }
}

/** Pull the outermost {...} out of a model reply, tolerating fences or chatter around it. */
function extractJson(raw: string): unknown {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('The model did not return a recipe. Try a different page or photo.')
  return JSON.parse(raw.slice(start, end + 1))
}

const RECIPE_PROMPT = `Extract the recipe from the content above and return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "title": "Recipe Name",
  "description": "1-2 sentence casual, conversational description — like a home cook talking to a friend, not a food blogger. Keep it short and chill.",
  "category": one of ["Breakfast","Lunch","Dinner","Desserts","Breads","Sides","Appetizers","Soups","Salads","Snacks","Drinks","Sauces","Holiday Recipes","Family Favorites"],
  "prepTime": integer minutes or null,
  "cookTime": integer minutes or null,
  "totalTime": integer minutes or null,
  "servings": integer or null,
  "difficulty": "easy" | "medium" | "advanced" | null,
  "sourceUrl": "",
  "sourceName": "",
  "tatesTips": "",
  "tags": ["only use tags from the allowed list below"],
  "ingredients": [
    { "quantity": "1", "measurement": "cup", "name": "all-purpose flour", "preparation": "sifted", "order": 0, "group": "Cake" }
  ],
  "instructions": [
    { "step": 1, "text": "Full step description." }
  ]
}

For "measurement" use only one of: "" "tsp" "tbsp" "cup" "oz" "fl oz" "pint" "quart" "gallon" "g" "kg" "lb" "pinch" "dash" "clove" "can" "package" "stick" "whole" "slice" "piece"
If the unit does not match any above, put the unit in the quantity field and use "" for measurement.
For "tags": ONLY use tags from this exact list — do not invent new ones:
Dietary: "Gluten Free" "Dairy Free" "Vegetarian" "Vegan" "Nut Free" "High Protein" "Low Sugar"
Occasion: "Weeknight Dinner" "Sunday Dinner" "BBQ" "Party" "Cozy Meal"
Holidays: "Christmas" "Thanksgiving" "Easter" "4th of July" "Halloween" "New Year's Eve" "Valentine's Day" "Mother's Day" "Father's Day" "St. Patrick's Day"
Other: "Devyn" "Family Favorite" "Quick" "Comfort Food" "Fancy" "Cozy" "Summer" "Meal Prep" "Crowd Pleaser" "Easy" "Worth the Effort"
Only include tags that genuinely apply. Leave the array empty if none fit.

For "group": if the recipe has labeled ingredient sections (e.g. "For the cake", "Frosting", "Sauce", "Dough"), set "group" to that section name for every ingredient in that section. If all ingredients belong to one unlabeled group, set "group" to "" for all of them.
Return ONLY the JSON object — no markdown fences, no explanation, nothing else.`

export async function parseRecipe(apiKey: string | undefined, body: unknown): Promise<Response> {
  if (!apiKey) return json({ error: MISSING_KEY, code: 'missing_key' }, 503)
  try {
    const { images, url } = (body ?? {}) as { images?: { data: string; mediaType: string }[]; url?: string }
    let messages: MessageParams['messages']

    if (images && images.length > 0) {
      messages = [{
        role: 'user',
        content: [
          ...images.map((img) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: img.mediaType, data: img.data },
          })),
          { type: 'text' as const, text: images.length > 1 ? `These ${images.length} images are pages of the same recipe. ${RECIPE_PROMPT}` : RECIPE_PROMPT },
        ],
      }]
    } else if (url) {
      const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TatesRecipes/1.0)' } })
      const html = await resp.text()
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                       .replace(/<style[\s\S]*?<\/style>/gi, '')
                       .replace(/<[^>]+>/g, ' ')
                       .replace(/\s+/g, ' ')
                       .slice(0, 40000)
      messages = [{ role: 'user', content: `URL: ${url}\n\nPage content:\n${text}\n\n${RECIPE_PROMPT}` }]
    } else {
      return json({ error: 'Provide images or url' }, 400)
    }

    const msg = await streamMessage(apiKey, { max_tokens: 16000, effort: 'medium', messages })

    if (msg.stopReason === 'refusal') {
      return json({ error: "Couldn't read a recipe from that. Try a different page or photo." }, 422)
    }

    return json(extractJson(msg.text.trim()))
  } catch (err) {
    console.error(err)
    return json({ error: err instanceof SyntaxError ? 'The recipe came back garbled. Try again.' : describeError(err) }, 500)
  }
}

// ─── Kitchen assistant ─────────────────────────────────────────

interface RecipeSummary {
  id?: string
  title: string
  category?: string
  totalTime?: number | null
  servings?: number | null
  tags?: string[]
  ingredients?: string[]
}

interface ChatTurn { role: 'user' | 'assistant'; content: string }

const ASSISTANT_PROMPT = `You are the kitchen assistant inside Made by Tate, Tate's personal recipe box. You're a warm, practical home cook: friendly, encouraging, and concise.

What you help with:
- Finding and suggesting recipes from Tate's collection (listed below)
- Scaling recipes up or down (do the math; give tidy, measurable amounts)
- Ingredient substitutions, with a quick note on how the result changes
- Meal planning and pairing ideas
- General cooking questions and techniques

Linking rule: whenever you mention a recipe that is in the collection, write its exact title wrapped in double square brackets, like [[Exact Recipe Title]], so the app can link it. Only do this for recipes in the list below, never for recipes that aren't in it.

Style: keep answers short and skimmable. Use markdown: short paragraphs, **bold** for key words, bullet or numbered lists, and an occasional ### heading for longer answers. No tables, no code blocks, no emoji. Prefer Tate's own recipes when they fit; if nothing in the collection fits, say so briefly and suggest an idea anyway.`

function formatCollection(recipes: RecipeSummary[]): string {
  if (!recipes.length) return "Tate's collection is empty right now."
  const lines = recipes.slice(0, 400).map((r) => {
    const meta = [
      r.category,
      r.totalTime ? `${r.totalTime} min` : null,
      r.servings ? `serves ${r.servings}` : null,
      r.tags?.length ? `tags: ${r.tags.join(', ')}` : null,
    ].filter(Boolean).join(' · ')
    const ingredients = r.ingredients?.length ? `\n  ingredients: ${r.ingredients.join('; ')}` : ''
    return `- ${r.title}${meta ? ` (${meta})` : ''}${ingredients}`
  })
  return `Tate's recipe collection (${recipes.length} recipes):\n${lines.join('\n')}`
}

/** Streams the reply as server-sent events: delta, refusal, error, done. */
export async function assistant(apiKey: string | undefined, body: unknown, signal?: AbortSignal): Promise<Response> {
  if (!apiKey) return json({ error: MISSING_KEY, code: 'missing_key' }, 503)

  const input = (body ?? {}) as { messages?: ChatTurn[]; recipes?: RecipeSummary[] }
  const turns = (input.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-30)
  // The API needs the conversation to start with a user turn.
  while (turns.length && turns[0].role !== 'user') turns.shift()
  if (!turns.length || turns[turns.length - 1].role !== 'user') {
    return json({ error: 'Send a question to ask the assistant.' }, 400)
  }
  // Sort by title so the cached system prefix stays byte-identical between requests.
  const recipes = [...(input.recipes ?? [])].sort((a, b) => a.title.localeCompare(b.title))

  // Stop generating (and billing) if the browser hangs up or hits Stop.
  const abort = new AbortController()
  signal?.addEventListener('abort', () => abort.abort())

  const encoder = new TextEncoder()
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try { controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)) } catch { /* closed */ }
      }
      try {
        const final = await streamMessage(apiKey, {
          max_tokens: 4096,
          effort: 'low',
          system: [
            { type: 'text', text: `${ASSISTANT_PROMPT}\n\n${formatCollection(recipes)}`, cache_control: { type: 'ephemeral' } },
          ],
          messages: turns.map((t) => ({ role: t.role, content: t.content })),
        }, (delta) => send('delta', { text: delta }), abort.signal)
        if (final.stopReason === 'refusal') send('refusal', { text: REFUSAL_TEXT })
        send('done', { stopReason: final.stopReason })
      } catch (err) {
        if (!abort.signal.aborted) {
          console.error(err)
          send('error', { error: describeError(err) })
        }
      }
      try { controller.close() } catch { /* already closed */ }
    },
    cancel() { abort.abort() },
  })

  return new Response(out, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' },
  })
}

/**
 * Checks the request carries a signed-in Supabase session. Only the admin can
 * sign in (sign-ups are off), so this keeps the API key from strangers.
 */
export async function isSignedIn(request: Request, supabaseUrl?: string, supabaseKey?: string): Promise<boolean> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ') || !supabaseUrl || !supabaseKey) return false
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseKey, Authorization: auth } })
  return res.ok
}
