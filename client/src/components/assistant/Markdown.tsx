import React from 'react'
import { Link } from 'react-router-dom'
import type { Recipe } from '../../types'
import { LeafIcon } from '../ui/Icons'
import styles from './Markdown.module.css'

/**
 * A small, safe markdown renderer for assistant replies. It builds React elements directly
 * (never injects HTML) and supports paragraphs, headings, bullet and numbered lists,
 * **bold**, *italic*, `code`, and [[Recipe Title]] links into the collection.
 */

type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; level: number; text: string }
  | { type: 'ul' | 'ol'; items: { text: string; nested: boolean }[]; start: number }
  | { type: 'hr' }

function parseBlocks(src: string): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') })
    para = []
  }

  for (const raw of src.replace(/\r/g, '').split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) { flush(); continue }

    const heading = /^\s*(#{1,4})\s+(.*)$/.exec(line)
    if (heading) { flush(); blocks.push({ type: 'h', level: heading[1].length, text: heading[2].replace(/#+\s*$/, '') }); continue }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); blocks.push({ type: 'hr' }); continue }

    const bullet = /^(\s*)[-*•+]\s+(.*)$/.exec(line)
    const numbered = /^(\s*)(\d+)[.)]\s+(.*)$/.exec(line)
    if (bullet || numbered) {
      flush()
      const type = bullet ? 'ul' : 'ol'
      const indent = (bullet ? bullet[1] : numbered![1]).length
      const text = bullet ? bullet[2] : numbered![3]
      const last = blocks[blocks.length - 1]
      // Indented items continue whichever list is open, shown as a nested level.
      if (last && (last.type === 'ul' || last.type === 'ol') && (last.type === type || indent >= 2)) {
        last.items.push({ text, nested: indent >= 2 })
      } else {
        blocks.push({ type, items: [{ text, nested: false }], start: numbered ? Number(numbered[2]) : 1 })
      }
      continue
    }

    // A wrapped continuation line of a list item
    const last = blocks[blocks.length - 1]
    if (!para.length && last && (last.type === 'ul' || last.type === 'ol') && /^\s{2,}/.test(raw)) {
      last.items[last.items.length - 1].text += ' ' + line.trim()
      continue
    }
    para.push(line.trim())
  }
  flush()
  return blocks
}

export type RecipeLookup = (title: string) => Recipe | undefined

const INLINE = /(\[\[[^\]\n]+\]\]|\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)/g

function renderInline(text: string, lookup: RecipeLookup, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let last = 0
  let i = 0
  for (const match of text.matchAll(INLINE)) {
    const token = match[0]
    const at = match.index ?? 0
    if (at > last) out.push(text.slice(last, at))
    const key = `${keyBase}-${i++}`
    if (token.startsWith('[[')) {
      const title = token.slice(2, -2).trim()
      const recipe = lookup(title)
      out.push(recipe
        ? <Link key={key} to={`/recipe/${recipe.id}`} className={styles.recipeLink}><LeafIcon size={12} strokeWidth={2} />{recipe.title}</Link>
        : <span key={key} className={styles.recipeText}>{title}</span>)
    } else if (token.startsWith('**') || token.startsWith('__')) {
      out.push(<strong key={key}>{renderInline(token.slice(2, -2), lookup, key)}</strong>)
    } else if (token.startsWith('`')) {
      out.push(<code key={key}>{token.slice(1, -1)}</code>)
    } else {
      out.push(<em key={key}>{renderInline(token.slice(1, -1), lookup, key)}</em>)
    }
    last = at + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** While streaming, hide half-typed markup at the very end so it doesn't flash. */
function trimPartial(text: string): string {
  const open = text.lastIndexOf('[[')
  if (open !== -1 && text.indexOf(']]', open) === -1) text = text.slice(0, open)
  const stars = text.match(/\*\*/g)?.length ?? 0
  if (stars % 2 === 1) {
    const at = text.lastIndexOf('**')
    text = text.slice(0, at) + text.slice(at + 2)
  }
  return text
}

export function Markdown({ text, lookup, streaming }: { text: string; lookup: RecipeLookup; streaming?: boolean }) {
  const blocks = parseBlocks(streaming ? trimPartial(text) : text)
  return (
    <div className={styles.md}>
      {blocks.map((b, bi) => {
        const k = `b${bi}`
        switch (b.type) {
          case 'p':
            return <p key={k}>{renderInline(b.text, lookup, k)}</p>
          case 'h':
            return b.level <= 2
              ? <h3 key={k} className={styles.h2}>{renderInline(b.text, lookup, k)}</h3>
              : <h4 key={k} className={styles.h3}>{renderInline(b.text, lookup, k)}</h4>
          case 'hr':
            return <hr key={k} />
          case 'ul':
          case 'ol': {
            const Tag = b.type
            return (
              <Tag key={k} start={b.type === 'ol' && b.start !== 1 ? b.start : undefined}>
                {b.items.map((it, ii) => (
                  <li key={ii} className={it.nested ? styles.nested : undefined}>{renderInline(it.text, lookup, `${k}-${ii}`)}</li>
                ))}
              </Tag>
            )
          }
        }
      })}
    </div>
  )
}
