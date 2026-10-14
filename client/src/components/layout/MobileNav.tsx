import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import styles from './MobileNav.module.css'
import { Brand } from './Brand'
import { NAV_GROUPS } from './nav'
import {
  HomeIcon, CalendarIcon, ShoppingBagIcon, SparkleIcon, MenuIcon, SearchIcon, PlusIcon, SunIcon, MoonIcon,
} from '../ui/Icons'
import { useAppData } from '../../lib/appData'
import { useTheme } from '../../hooks/useTheme'
import { Modal } from '../ui/Modal'

const TABS = [
  { to: '/', label: 'Recipes', Icon: HomeIcon },
  { to: '/planner', label: 'Plan', Icon: CalendarIcon },
  { to: '/grocery', label: 'Grocery', Icon: ShoppingBagIcon },
  { to: '/assistant', label: 'Ask', Icon: SparkleIcon },
]

export function MobileNav({ onOpenSearch }: { onOpenSearch: () => void }) {
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const { grocery } = useAppData()
  const { isDark, toggle } = useTheme()
  const toBuy = grocery.filter((g) => !g.checked).length

  return (
    <>
      <header className={styles.topBar}>
        <Brand compact />
        <div className={styles.topActions}>
          <button className={styles.iconBtn} onClick={onOpenSearch} aria-label="Search">
            <SearchIcon size={19} strokeWidth={1.75} />
          </button>
          <button className={styles.iconBtn} onClick={toggle} aria-label="Toggle dark mode">
            {isDark ? <SunIcon size={19} strokeWidth={1.75} /> : <MoonIcon size={19} strokeWidth={1.75} />}
          </button>
          <button className={styles.addBtn} onClick={() => navigate('/add')} aria-label="New recipe">
            <PlusIcon size={18} strokeWidth={2.25} />
          </button>
        </div>
      </header>

      <nav className={styles.tabBar} aria-label="Main">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}>
            <span className={styles.tabIcon}>
              <Icon size={21} strokeWidth={1.75} />
              {to === '/grocery' && toBuy > 0 && <span className={styles.badge}>{toBuy}</span>}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
        <button className={styles.tab} onClick={() => setMoreOpen(true)}>
          <span className={styles.tabIcon}><MenuIcon size={21} strokeWidth={1.75} /></span>
          <span>More</span>
        </button>
      </nav>

      <Modal isOpen={moreOpen} onClose={() => setMoreOpen(false)} title="Everything" size="sm">
        <div className={styles.moreGrid}>
          {NAV_GROUPS.flatMap((g) => g.items).map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={styles.moreItem} onClick={() => setMoreOpen(false)}>
              <Icon size={20} strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </Modal>
    </>
  )
}
