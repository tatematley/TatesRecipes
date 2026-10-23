import 'dotenv/config'
import express from 'express'
import type { Response as ExpressResponse } from 'express'
import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { parseRecipe, assistant } from '../../client/api-core/ai'

/**
 * Local stand-in for the Cloudflare Pages Functions in client/functions/api:
 * the same AI code, served on :3001 for Vite's /api proxy. Production runs on
 * Cloudflare, where requests must come from the signed-in admin.
 */
const app = express()
app.use(express.json({ limit: '20mb' }))

async function send(res: ExpressResponse, response: Response) {
  res.status(response.status)
  response.headers.forEach((value, key) => res.setHeader(key, value))
  if (!response.body) return res.end()
  res.flushHeaders()
  Readable.fromWeb(response.body as NodeReadableStream).pipe(res)
}

app.post('/api/parse-recipe', async (req, res) => {
  await send(res, await parseRecipe(process.env.ANTHROPIC_API_KEY, req.body))
})

app.post('/api/assistant', async (req, res) => {
  // Stop generating (and billing) if the browser hangs up or hits Stop.
  const abort = new AbortController()
  res.on('close', () => { if (!res.writableEnded) abort.abort() })
  await send(res, await assistant(process.env.ANTHROPIC_API_KEY, req.body, abort.signal))
})

app.listen(3001, () => console.log('API server → http://localhost:3001'))
