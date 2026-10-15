import { NavLink, useNavigate } from 'react-router-dom'
import styles from './Sidebar.module.css'
import { NAV_GROUPS } from './nav'
import { PlusIcon, SearchIcon, SunIcon, MoonIcon } from '../ui/Icons'
import { useAppData } from '../../lib/appData'
import { isDemo } from '../../lib/supabase'
import { useTheme } from '../../hooks/useTheme'
import { Brand } from './Brand'

export function Sidebar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const navigate = useNavigate()
  const { grocery, syncStatus } = useAppData()
  const { isDark, toggle } = useTheme()
  const toBuy = grocery.filter((g) => !g.checked).length
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <aside className={`${styles.sidebar} forest-surface`}>
      <div className={styles.top}>
        <Brand />
        <button className={styles.search} onClick={onOpenSearch}>
          <SearchIcon size={15} strokeWidth={1.75} />
          <span>Search</span>
          <kbd className={styles.kbd}>{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
      </div>

      <nav className={styles.nav} aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className={styles.group}>
            <p className={styles.groupLabel}>{group.label}</p>
            <ul className={styles.navList}>
              {group.items.map(({ to, label, Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}
                  >
                    <Icon size={17} strokeWidth={1.75} className={styles.navIcon} />
                    <span>{label}</span>
                    {to === '/grocery' && toBuy > 0 && <span className={styles.count}>{toBuy}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.bottom}>
        <button className={styles.addBtn} onClick={() => navigate('/add')}>
          <PlusIcon size={16} strokeWidth={2.25} />
          New recipe
        </button>
        <div className={styles.footer}>
          <span className={styles.sync} title={isDemo ? 'No Supabase credentials found; using sample recipes saved in this browser' : undefined}>
            <span className={`${styles.dot} ${isDemo ? styles.dotDemo : styles[`dot_${syncStatus}`]}`} />
            {isDemo ? 'Demo mode' : syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing…' : 'Saved on this device'}
          </span>
          <button className={styles.themeBtn} onClick={toggle} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDark ? <SunIcon size={16} strokeWidth={1.75} /> : <MoonIcon size={16} strokeWidth={1.75} />}
          </button>
        </div>
      </div>
    </aside>
  )
}
