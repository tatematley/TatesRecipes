import 'dotenv/config'
import express from 'express'
import type { Response } from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'] }))
app.use(express.json({ limit: '20mb' }))

const MODEL = 'claude-opus-5-5'
const FALLBACK_BETA = 'server-side-fallback-2026-07-01'
const MISSING_KEY = 'Add ANTHROPIC_API_KEY to server/.env to turn on the assistant'
const REFUSAL_TEXT = "Sorry, I can't help with that one. Try asking about something else from the kitchen!"

// Created lazily so the server still boots (and can explain itself) without a key.
let client: Anthropic | null = null
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return client
}

/** Turn SDK errors into a short, human message the UI can show. */
function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in server/.env.'
  if (err instanceof Anthropic.PermissionDeniedError) return 'This API key does not have access to that model.'
  if (err instanceof Anthropic.RateLimitError) return 'The assistant is a bit busy right now. Try again in a moment.'
  if (err instanceof Anthropic.BadRequestError) return `The request was rejected: ${err.message}`
  if (err instanceof Anthropic.APIConnectionError) return 'Could not reach the Anthropic API. Check your internet connection.'
  if (err instanceof Anthropic.InternalServerError) return 'The Anthropic API had a hiccup. Try again in a moment.'
  if (err instanceof Anthropic.APIError) return `Anthropic API error${err.status ? ` (${err.status})` : ''}: ${err.message}`
  return err instanceof Error ? err.message : 'Something went wrong'
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

app.post('/api/parse-recipe', async (req, res) => {
  const anthropic = getClient()
  if (!anthropic) {
    res.status(503).json({ error: MISSING_KEY, code: 'missing_key' })
    return
  }
  try {
    const { images, url } = req.body as {
      images?: { data: string; mediaType: string }[]
      url?: string
    }

    let messages: Anthropic.Beta.BetaMessageParam[]

    if (images && images.length > 0) {
      messages = [{
        role: 'user',
        content: [
          ...images.map((img) => ({
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: img.data,
            },
          })),
          { type: 'text' as const, text: images.length > 1 ? `These ${images.length} images are pages of the same recipe. ${RECIPE_PROMPT}` : RECIPE_PROMPT },
        ],
      }]
    } else if (url) {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TatesRecipes/1.0)' },
      })
      const html = await resp.text()
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                       .replace(/<style[\s\S]*?<\/style>/gi, '')
                       .replace(/<[^>]+>/g, ' ')
                       .replace(/\s+/g, ' ')
                       .slice(0, 40000)
      messages = [{
        role: 'user',
        content: `URL: ${url}\n\nPage content:\n${text}\n\n${RECIPE_PROMPT}`,
      }]
    } else {
      res.status(400).json({ error: 'Provide images or url' })
      return
    }

    const msg = await anthropic.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      messages,
    }).finalMessage()

    if (msg.stop_reason === 'refusal') {
      res.status(422).json({ error: "Couldn't read a recipe from that. Try a different page or photo." })
      return
    }

    const raw = msg.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    res.json(extractJson(raw))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof SyntaxError ? 'The recipe came back garbled. Try again.' : describeError(err) })
  }
})

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

const ASSISTANT_PROMPT = `You are the kitchen assistant inside Tate & Thyme, Tate's personal recipe box. You're a warm, practical home cook: friendly, encouraging, and concise.

What you help with:
- Finding and suggesting recipes from Tate's collection (listed below)
- Scaling recipes up or down (do the math; give tidy, measurable amounts)
- Ingredient substitutions, with a quick note on how the result changes
- Meal planning and pairing ideas
- General cooking questions and techniques

Linking rule: whenever you mention a recipe that is in the collection, write its exact title wrapped in double square brackets, like [[Exact Recipe Title]], so the app can link it. Only do this for recipes in the list below, never for recipes that aren't in it.

Style: keep answers short and skimmable. Use markdown: short paragraphs, **bold** for key words, bullet or numbered lists, and an occasional ### heading for longer answers. No tables, no code blocks. Prefer Tate's own recipes when they fit; if nothing in the collection fits, say so briefly and suggest an idea anyway.`

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

function sse(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

app.post('/api/assistant', async (req, res) => {
  const anthropic = getClient()
  if (!anthropic) {
    res.status(503).json({ error: MISSING_KEY, code: 'missing_key' })
    return
  }

  const body = req.body as { messages?: ChatTurn[]; recipes?: RecipeSummary[] }
  const turns = (body.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-30)
  // The API needs the conversation to start with a user turn.
  while (turns.length && turns[0].role !== 'user') turns.shift()
  if (!turns.length || turns[turns.length - 1].role !== 'user') {
    res.status(400).json({ error: 'Send a question to ask the assistant.' })
    return
  }
  // Sort by title so the cached system prefix stays byte-identical between requests.
  const recipes = [...(body.recipes ?? [])].sort((a, b) => a.title.localeCompare(b.title))

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()

  const stream = anthropic.beta.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    output_config: { effort: 'low' },
    betas: [FALLBACK_BETA],
    fallbacks: 'default',
    system: [
      { type: 'text', text: `${ASSISTANT_PROMPT}\n\n${formatCollection(recipes)}`, cache_control: { type: 'ephemeral' } },
    ],
    messages: turns.map((t) => ({ role: t.role, content: t.content })),
  })

  // Stop generating (and billing) if the browser hangs up or hits Stop.
  res.on('close', () => { if (!res.writableEnded) stream.abort() })

  stream.on('text', (delta) => sse(res, 'delta', { text: delta }))

  try {
    const final = await stream.finalMessage()
    if (final.stop_reason === 'refusal') sse(res, 'refusal', { text: REFUSAL_TEXT })
    sse(res, 'done', { stopReason: final.stop_reason })
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError) return
    console.error(err)
    sse(res, 'error', { error: describeError(err) })
  }
  res.end()
})

app.listen(3001, () => console.log('API server → http://localhost:3001'))
