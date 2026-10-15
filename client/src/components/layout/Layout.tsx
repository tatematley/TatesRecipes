import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CommandPalette } from './CommandPalette'
import { Brand } from './Brand'
import { PlusIcon } from '../ui/Icons'
import styles from './Layout.module.css'

export function Layout({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

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
        <button className={styles.addBtn} onClick={() => navigate('/add')} aria-label="New recipe">
          <PlusIcon size={22} strokeWidth={2.25} />
        </button>
      </header>
      <main className={styles.main} key={location.pathname}>
        {children}
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
