import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CommandPalette } from './CommandPalette'
import { LoginModal } from './LoginModal'
import { PhotoPresetModal } from './PhotoPresetModal'
import { useAuth } from '../../context/AuthContext'
import { Brand } from './Brand'
import { PlusIcon, SearchIcon, XIcon } from '../ui/Icons'
import { useOpenAdd, backgroundFor } from '../../hooks/useOpenAdd'
import styles from './Layout.module.css'

export function Layout({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const { isAdmin, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const openAdd = useOpenAdd()
  // While the add pop-up is open, the page behind it stays put
  const page = backgroundFor(location) ?? location
  const [params, setParams] = useSearchParams()
  // The home grid and the admin's All recipes grid both filter by the top-bar search
  const searchable = page.pathname === '/' || page.pathname === '/manage'
  const query = searchable ? new URLSearchParams(page.search).get('q') ?? '' : ''

  // Search lives in the URL so the home page grid can read it
  function setQuery(q: string) {
    if (location.pathname !== '/' && location.pathname !== '/manage') {
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
  useEffect(() => { window.scrollTo({ top: 0 }) }, [page.pathname])

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
          {isAdmin && (
            <button className={styles.addBtn} onClick={openAdd} aria-label="New recipe">
              <PlusIcon size={28} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>
      <main className={styles.main} key={page.pathname}>
        {children}
      </main>
      <footer className={styles.footer}>
        {isAdmin ? (
          <>
            <Link className={styles.adminLink} to="/manage">All recipes</Link>
            <button className={styles.adminLink} onClick={() => setPresetOpen(true)}>Photo look</button>
            <button className={styles.adminLink} onClick={signOut}>Sign out</button>
          </>
        ) : (
          <button className={styles.adminLink} onClick={() => setLoginOpen(true)}>Admin</button>
        )}
      </footer>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      {isAdmin && <PhotoPresetModal isOpen={presetOpen} onClose={() => setPresetOpen(false)} />}
    </div>
  )
}
