import { useSyncExternalStore } from 'react'
import type { Recipe } from '../../types'
import { authHeaders } from '../../lib/supabase'

/**
 * Conversation state for the kitchen assistant. Lives outside React so a reply keeps
 * streaming while you browse other pages, and is mirrored to sessionStorage so the
 * chat survives navigation and reloads within the tab.
 */

export type ChatErrorKind = 'setup' | 'offline' | 'error'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'streaming' | 'done' | 'stopped' | 'error' | 'refused'
  error?: { kind: ChatErrorKind; message: string }
}

interface ChatState {
  messages: ChatMessage[]
  streaming: boolean
}

export interface RecipeSummary {
  title: string
  category: string
  totalTime: number | null
  servings: number | null
  tags: string[]
  ingredients: string[]
}

const STORAGE_KEY = 'tt:assistant:chat'

function load(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatMessage[]
    if (!Array.isArray(parsed)) return []
    // A reply that was mid-stream when the tab reloaded can't resume.
    return parsed.map((m) => (m.status === 'streaming' ? { ...m, status: 'stopped' } : m))
  } catch {
    return []
  }
}

let state: ChatState = { messages: load(), streaming: false }
let controller: AbortController | null = null
const listeners = new Set<() => void>()
let saveTimer: number | undefined

function persist(immediate = false) {
  const write = () => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages)) } catch { /* storage full or blocked */ }
  }
  window.clearTimeout(saveTimer)
  if (immediate) write()
  else saveTimer = window.setTimeout(write, 400)
}

function setState(next: Partial<ChatState>, saveNow = false) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
  persist(saveNow)
}

function patchMessage(id: string, patch: Partial<ChatMessage> | ((m: ChatMessage) => Partial<ChatMessage>)) {
  setState({
    messages: state.messages.map((m) => (m.id === id ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)),
  })
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

/** Compact, token-cheap view of the collection for the system prompt. */
export function summarizeRecipes(recipes: Recipe[]): RecipeSummary[] {
  return recipes.map((r) => ({
    title: r.title,
    category: r.category,
    totalTime: r.totalTime,
    servings: r.servings,
    tags: r.tags,
    ingredients: r.ingredients.map((i) => [i.quantity, i.measurement, i.name].filter(Boolean).join(' ').trim()),
  }))
}

async function readError(res: Response): Promise<{ kind: ChatErrorKind; message: string }> {
  let body: { error?: string; code?: string } | null = null
  try { body = await res.json() } catch { /* not JSON: likely the dev proxy with no server behind it */ }
  if (body?.code === 'missing_key') return { kind: 'setup', message: body.error ?? 'The assistant needs an API key.' }
  if (!body?.error) return { kind: 'offline', message: 'The assistant server is not running.' }
  return { kind: 'error', message: body.error }
}

export async function sendMessage(text: string, recipes: Recipe[]) {
  const question = text.trim()
  if (!question || state.streaming) return

  const user: ChatMessage = { id: uid(), role: 'user', content: question, status: 'done' }
  const reply: ChatMessage = { id: uid(), role: 'assistant', content: '', status: 'streaming' }
  const history = [...state.messages, user]
  setState({ messages: [...history, reply], streaming: true }, true)

  // Only send real turns; failed or empty replies would confuse the model.
  const payload = history
    .filter((m) => m.content.trim() && m.status !== 'error' && m.status !== 'refused')
    .map((m) => ({ role: m.role, content: m.content }))

  controller = new AbortController()
  try {
    const res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ messages: payload, recipes: summarizeRecipes(recipes) }),
      signal: controller.signal,
    })
    if (!res.ok || !res.body) {
      patchMessage(reply.id, { status: 'error', error: await readError(res) })
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finished = false

    const handle = (event: string, data: string) => {
      let parsed: { text?: string; error?: string } = {}
      try { parsed = JSON.parse(data) } catch { return }
      if (event === 'delta' && parsed.text) {
        patchMessage(reply.id, (m) => ({ content: m.content + parsed.text }))
      } else if (event === 'refusal') {
        patchMessage(reply.id, { content: parsed.text ?? '', status: 'refused' })
      } else if (event === 'error') {
        patchMessage(reply.id, { status: 'error', error: { kind: 'error', message: parsed.error ?? 'Something went wrong.' } })
        finished = true
      } else if (event === 'done') {
        patchMessage(reply.id, (m) => ({ status: m.status === 'streaming' ? 'done' : m.status }))
        finished = true
      }
    }

    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let split: number
      while ((split = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const block = buffer.slice(0, split)
        buffer = buffer.slice(split).replace(/^\r?\n\r?\n/, '')
        let event = 'message'
        const data: string[] = []
        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith('event:')) event = line.slice(6).trim()
          else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
        }
        if (data.length) handle(event, data.join('\n'))
      }
    }
    if (!finished) {
      patchMessage(reply.id, (m) => (m.status === 'streaming'
        ? m.content ? { status: 'stopped' } : { status: 'error', error: { kind: 'error', message: 'The reply was cut off. Try again.' } }
        : {}))
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      patchMessage(reply.id, (m) => ({ status: m.status === 'streaming' ? 'stopped' : m.status }))
    } else {
      patchMessage(reply.id, { status: 'error', error: { kind: 'offline', message: 'Could not reach the assistant server.' } })
    }
  } finally {
    controller = null
    setState({ streaming: false }, true)
  }
}

export function stopStreaming() {
  controller?.abort()
}

export function resetChat() {
  controller?.abort()
  setState({ messages: [], streaming: false }, true)
}

/** Drop a failed reply and its question, then ask again. */
export function retryLast(recipes: Recipe[]) {
  if (state.streaming) return
  const msgs = state.messages
  const lastUser = [...msgs].reverse().find((m) => m.role === 'user')
  if (!lastUser) return
  setState({ messages: msgs.slice(0, msgs.indexOf(lastUser)) })
  void sendMessage(lastUser.content, recipes)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function useChat(): ChatState {
  return useSyncExternalStore(subscribe, () => state)
}
