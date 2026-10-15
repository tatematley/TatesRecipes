import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CommandPalette } from './CommandPalette'
import { Brand } from './Brand'
import { PlusIcon, SearchIcon, XIcon } from '../ui/Icons'
import styles from './Layout.module.css'

export function Layout({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const query = location.pathname === '/' ? params.get('q') ?? '' : ''

  // Search lives in the URL so the home page grid can read it
  function setQuery(q: string) {
    if (location.pathname !== '/') {
      navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
      return
    }
    const next = new URLSearchParams(params)
    if (q) next.set('q', q)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  // ⌘K / Ctrl+K anywhere, or "/" when not typing
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const typing = target.closest('input, textarea, select, [contenteditable="true"]')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      } else if (e.key === '/' && !typing) {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // New page → top of the page
  useEffect(() => { window.scrollTo({ top: 0 }) }, [location.pathname])

  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <Brand />
        <div className={styles.actions}>
          <div className={styles.search}>
            <SearchIcon size={16} strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes"
              aria-label="Search recipes"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search" className={styles.clear}>
                <XIcon size={12} strokeWidth={2} />
              </button>
            )}
          </div>
          <button className={styles.addBtn} onClick={() => navigate('/add')} aria-label="New recipe">
            <PlusIcon size={28} strokeWidth={2} />
          </button>
        </div>
      </header>
      <main className={styles.main} key={location.pathname}>
        {children}
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
