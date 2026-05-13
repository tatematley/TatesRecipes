import { NavLink, useNavigate } from 'react-router-dom'
import styles from './Sidebar.module.css'
import { ALL_CATEGORIES } from '../../types'
import {
  BookOpenIcon, StarIcon, UserIcon, LeafIcon,
  ShoppingBagIcon, FolderIcon, CalendarIcon, SparkleIcon, PlusIcon,
} from '../ui/Icons'

const NAV_ITEMS = [
  { to: '/',            label: 'Recipe Box',      Icon: BookOpenIcon },
  { to: '/favorites',   label: 'Favorites',       Icon: StarIcon },
  { to: '/created',     label: 'Created by Tate', Icon: UserIcon },
  { to: '/pantry',      label: 'Pantry Mode',     Icon: LeafIcon },
  { to: '/grocery',     label: 'Grocery Lists',   Icon: ShoppingBagIcon },
  { to: '/collections', label: 'Collections',     Icon: FolderIcon },
  { to: '/planner',     label: 'Meal Planner',    Icon: CalendarIcon },
  { to: '/assistant',   label: 'AI Assistant',    Icon: SparkleIcon },
]

export function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand} onClick={() => navigate('/')}>
        <span className={styles.brandName}>Tate's Recipes</span>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  [styles.navLink, isActive ? styles.active : ''].join(' ')
                }
              >
                <Icon size={15} strokeWidth={1.75} className={styles.navIcon} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.divider} />

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Categories</p>
        <ul className={styles.categoryList}>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                [styles.categoryLink, isActive ? styles.categoryActive : ''].join(' ')
              }
            >
              All Recipes
            </NavLink>
          </li>
          {ALL_CATEGORIES.map((cat) => (
            <li key={cat}>
              <NavLink
                to={`/?category=${encodeURIComponent(cat)}`}
                className={({ isActive }) =>
                  [styles.categoryLink, isActive ? styles.categoryActive : ''].join(' ')
                }
              >
                {cat}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.addWrap}>
        <button className={styles.addBtn} onClick={() => navigate('/add')}>
          <PlusIcon size={14} strokeWidth={2} />
          Add Recipe
        </button>
      </div>
    </aside>
  )
}
