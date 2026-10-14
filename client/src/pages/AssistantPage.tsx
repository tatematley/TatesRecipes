import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import {
  CalendarIcon, ClockIcon, CopyIcon, FlameIcon, LeafIcon, PlusIcon, RefreshIcon, ScaleIcon, SendIcon,
} from '../components/ui/Icons'
import { useRecipeContext } from '../context/RecipeContext'
import { Markdown, type RecipeLookup } from '../components/assistant/Markdown'
import { SprigAvatar } from '../components/assistant/SprigAvatar'
import {
  resetChat, retryLast, sendMessage, stopStreaming, useChat, type ChatMessage,
} from '../components/assistant/chatStore'
import styles from './AssistantPage.module.css'

const SUGGESTIONS: { text: string; hint: string; Icon: (p: { size?: number }) => React.ReactElement }[] = [
  { text: 'What can I make in 30 minutes?', hint: 'Quick weeknight wins', Icon: ClockIcon },
  { text: 'Plan 3 dinners for this week', hint: 'A little meal plan', Icon: CalendarIcon },
  { text: 'Halve the cinnamon rolls', hint: 'Scale any recipe', Icon: ScaleIcon },
  { text: 'Substitute for buttermilk?', hint: 'Swaps that work', Icon: RefreshIcon },
  { text: "Something cozy with what's in the pantry", hint: 'Comfort food ideas', Icon: FlameIcon },
  { text: 'Which of my recipes are vegetarian?', hint: 'Search the collection', Icon: LeafIcon },
]

const norm = (s: string) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()

export function AssistantPage() {
  const { recipes, loading } = useRecipeContext()
  const { messages, streaming } = useChat()
  const [params, setParams] = useSearchParams()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const askedFromUrl = useRef(false)
  const toast = useToast()

  const lookup = useMemo<RecipeLookup>(() => {
    const byTitle = new Map(recipes.map((r) => [norm(r.title), r]))
    return (title) => byTitle.get(norm(title))
  }, [recipes])

  const ask = useCallback((text: string) => {
    if (!text.trim() || streaming) return
    stickToBottom.current = true
    void sendMessage(text, recipes)
    setDraft('')
  }, [recipes, streaming])

  // The command palette sends people here with ?q=…; ask it once the recipes are ready.
  useEffect(() => {
    const q = params.get('q')
    if (!q || askedFromUrl.current || loading) return
    askedFromUrl.current = true
    setParams((p) => { p.delete('q'); return p }, { replace: true })
    if (!streaming) ask(q)
    else setDraft(q)
  }, [params, loading, ask, setParams, streaming])

  // Follow the reply as it streams, unless the reader scrolled up to look at something.
  useEffect(() => {
    const onScroll = () => {
      const fromBottom = document.documentElement.scrollHeight - window.innerHeight - window.scrollY
      stickToBottom.current = fromBottom < 160
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useLayoutEffect(() => {
    if (messages.length && stickToBottom.current) endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  // Autosize the composer
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [draft, messages.length === 0])

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      ask(draft)
    }
  }

  function newChat() {
    resetChat()
    setDraft('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    inputRef.current?.focus()
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text.replace(/\[\[([^\]]+)\]\]/g, '$1'))
      toast('Copied to clipboard')
    } catch {
      toast('Could not copy')
    }
  }

  const empty = messages.length === 0

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Ask"
        title={<>Kitchen <em>assistant</em></>}
        subtitle={empty ? 'Scaling, swaps, meal plans and “what should I make?” — answered from your own recipe box.' : undefined}
        actions={!empty && (
          <Button variant="secondary" size="sm" icon={<PlusIcon size={15} />} onClick={newChat}>New chat</Button>
        )}
      />

      {empty ? (
        <section className={styles.intro}>
          <div className={styles.hello}>
            <SprigAvatar size={44} />
            <div>
              <h2 className={styles.helloTitle}>What are we cooking?</h2>
              <p className={styles.helloText}>
                {loading ? 'Reading your recipe box…' : `I know all ${recipes.length} of your recipes. Ask me anything.`}
              </p>
            </div>
          </div>
          <div className={styles.suggestions}>
            {SUGGESTIONS.map(({ text, hint, Icon }, i) => (
              <button
                key={text}
                type="button"
                className={styles.suggestion}
                style={{ animationDelay: `${60 + i * 45}ms` }}
                onClick={() => ask(text)}
                disabled={loading}
              >
                <span className={styles.suggestionIcon}><Icon size={16} /></span>
                <span className={styles.suggestionText}>
                  <span className={styles.suggestionLabel}>{text}</span>
                  <span className={styles.suggestionHint}>{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <ol className={styles.thread} aria-live="polite" data-thread>
          {messages.map((m, i) => (
            <MessageRow
              key={m.id}
              message={m}
              lookup={lookup}
              isLast={i === messages.length - 1}
              onCopy={copy}
              onRetry={() => retryLast(recipes)}
            />
          ))}
        </ol>
      )}
      <div ref={endRef} className={styles.end} />

      <div className={styles.composerDock}>
        <form
          className={styles.composer}
          onSubmit={(e) => { e.preventDefault(); ask(draft) }}
        >
          <textarea
            ref={inputRef}
            className={styles.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={empty ? 'Ask about recipes, swaps, timing…' : 'Ask a follow-up…'}
            rows={1}
            aria-label="Message the kitchen assistant"
          />
          {streaming ? (
            <button type="button" className={`${styles.sendBtn} ${styles.stopBtn}`} onClick={stopStreaming} aria-label="Stop generating">
              <span className={styles.stopSquare} />
            </button>
          ) : (
            <button type="submit" className={styles.sendBtn} disabled={!draft.trim()} aria-label="Send">
              <SendIcon size={17} strokeWidth={2} />
            </button>
          )}
        </form>
        <p className={styles.hint}><kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line</p>
      </div>
    </div>
  )
}

function MessageRow({ message: m, lookup, isLast, onCopy, onRetry }: {
  message: ChatMessage
  lookup: RecipeLookup
  isLast: boolean
  onCopy: (text: string) => void
  onRetry: () => void
}) {
  if (m.role === 'user') {
    return (
      <li className={`${styles.row} ${styles.userRow}`}>
        <div className={styles.userBubble}>{m.content}</div>
      </li>
    )
  }

  const isStreaming = m.status === 'streaming'
  return (
    <li className={`${styles.row} ${styles.botRow}`}>
      <SprigAvatar size={30} active={isStreaming} />
      <div className={styles.botBody}>
        {m.content ? (
          <div className={m.status === 'refused' ? styles.refused : undefined}>
            <Markdown text={m.content} lookup={lookup} streaming={isStreaming} />
          </div>
        ) : isStreaming ? (
          <div className={styles.typing} aria-label="The assistant is writing"><span /><span /><span /></div>
        ) : null}

        {m.status === 'error' && m.error && <ErrorNotice error={m.error} onRetry={isLast ? onRetry : undefined} />}

        {m.status === 'stopped' && <p className={styles.meta}>Stopped</p>}

        {(m.status === 'done' || m.status === 'stopped') && m.content && (
          <div className={styles.actions}>
            <button type="button" className={styles.actionBtn} onClick={() => onCopy(m.content)}>
              <CopyIcon size={13} /> Copy
            </button>
            {isLast && (
              <button type="button" className={styles.actionBtn} onClick={onRetry}>
                <RefreshIcon size={13} /> Retry
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

function ErrorNotice({ error, onRetry }: { error: NonNullable<ChatMessage['error']>; onRetry?: () => void }) {
  if (error.kind === 'error') {
    return (
      <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
        <p className={styles.noticeText}>{error.message}</p>
        {onRetry && <Button variant="secondary" size="sm" icon={<RefreshIcon size={14} />} onClick={onRetry}>Try again</Button>}
      </div>
    )
  }
  const setup = error.kind === 'setup'
  return (
    <div className={styles.notice} role="status">
      <p className="eyebrow">{setup ? 'One quick step' : 'Assistant offline'}</p>
      <h3 className={styles.noticeTitle}>{setup ? 'Turn on the assistant' : 'The assistant server isn’t running'}</h3>
      <p className={styles.noticeText}>
        {setup
          ? 'The assistant talks to Claude, so it needs an Anthropic API key. Your recipes stay right where they are.'
          : 'The kitchen assistant runs on the small server that comes with the app. Start it, then try again.'}
      </p>
      <ol className={styles.steps}>
        {setup ? (
          <>
            <li>Create <code>server/.env</code> with <code>ANTHROPIC_API_KEY=sk-ant-…</code></li>
            <li>Restart the dev servers with <code>npm run dev</code> at the repo root</li>
          </>
        ) : (
          <>
            <li>Run <code>npm run dev</code> at the repo root (starts the app and the server)</li>
            <li>Make sure <code>server/.env</code> has your <code>ANTHROPIC_API_KEY</code></li>
          </>
        )}
      </ol>
      {onRetry && <Button variant="secondary" size="sm" icon={<RefreshIcon size={14} />} onClick={onRetry}>Try again</Button>}
    </div>
  )
}
