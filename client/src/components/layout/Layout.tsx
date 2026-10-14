import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { CommandPalette } from './CommandPalette'
import styles from './Layout.module.css'

export function Layout({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()

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
      <Sidebar onOpenSearch={() => setPaletteOpen(true)} />
      <MobileNav onOpenSearch={() => setPaletteOpen(true)} />
      <main className={styles.main} key={location.pathname}>
        {children}
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
