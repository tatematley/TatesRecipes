import { NavLink, useNavigate } from 'react-router-dom'
import styles from './Sidebar.module.css'
import { ALL_CATEGORIES } from '../../types'

const NAV_ITEMS = [
  { to: '/',            label: 'Recipe Box',       icon: '📖' },
  { to: '/favorites',   label: 'Favorites',        icon: '★' },
  { to: '/created',     label: 'Created by Tate',  icon: '👨‍🍳' },
  { to: '/pantry',      label: 'Pantry Mode',      icon: '🥕' },
  { to: '/grocery',     label: 'Grocery Lists',    icon: '🛒' },
  { to: '/collections', label: 'Collections',      icon: '📂' },
  { to: '/planner',     label: 'Meal Planner',     icon: '📅' },
  { to: '/assistant',   label: 'AI Assistant',     icon: '✨' },
]

const CATEGORY_ICONS: Record<string, string> = {
  Breakfast:         '🍳',
  Lunch:             '🥗',
  Dinner:            '🍽️',
  Desserts:          '🍰',
  Breads:            '🍞',
  Sides:             '🥦',
  Appetizers:        '🧆',
  Soups:             '🍲',
  Salads:            '🥙',
  Snacks:            '🍿',
  Drinks:            '🍹',
  Sauces:            '🫙',
  'Holiday Recipes': '🎄',
  'Family Favorites':'❤️',
}

export function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand} onClick={() => navigate('/')}>
        <div className={styles.brandIcon}>🍴</div>
        <div>
          <div className={styles.brandName}>Tate's Recipes</div>
          <div className={styles.brandTagline}>My digital kitchen</div>
        </div>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  [styles.navLink, isActive ? styles.active : ''].join(' ')
                }
              >
                <span className={styles.navIcon}>{icon}</span>
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Categories</div>
        <ul className={styles.categoryList}>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                [styles.categoryLink, isActive ? styles.active : ''].join(' ')
              }
            >
              <span>🍴</span>
              <span>All Recipes</span>
            </NavLink>
          </li>
          {ALL_CATEGORIES.map((cat) => (
            <li key={cat}>
              <NavLink
                to={`/?category=${encodeURIComponent(cat)}`}
                className={({ isActive }) =>
                  [styles.categoryLink, isActive ? styles.active : ''].join(' ')
                }
              >
                <span>{CATEGORY_ICONS[cat] ?? '🍴'}</span>
                <span>{cat}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.addBtn} onClick={() => navigate('/add')}>
        <span>+</span>
        <span>Add Recipe</span>
      </div>
    </aside>
  )
}
