import React, { useEffect, useRef, useState } from 'react'
import styles from './Menu.module.css'

interface MenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
}

/** A small dropdown menu anchored to its trigger. */
export function Menu({ trigger, items, align = 'right' }: { trigger: (open: () => void) => React.ReactNode; items: MenuItem[]; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div className={styles.wrap} ref={ref}>
      {trigger(() => setOpen((o) => !o))}
      {open && (
        <div className={`${styles.menu} ${styles[align]}`} role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              className={`${styles.item} ${item.danger ? styles.danger : ''}`}
              onClick={() => { setOpen(false); item.onClick() }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
