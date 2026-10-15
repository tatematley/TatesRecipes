import {
  HomeIcon, HeartIcon, ChefHatIcon, CalendarIcon, ShoppingBagIcon, LeafIcon, FolderIcon, SparkleIcon,
} from '../ui/Icons'

export const NAV_GROUPS = [
  {
    label: 'Recipes',
    items: [
      { to: '/', label: 'Recipe Box', Icon: HomeIcon },
      { to: '/favorites', label: 'Favorites', Icon: HeartIcon },
      { to: '/created', label: "Tate's Originals", Icon: ChefHatIcon },
      { to: '/collections', label: 'Collections', Icon: FolderIcon },
    ],
  },
  {
    label: 'Plan & shop',
    items: [
      { to: '/planner', label: 'Meal Planner', Icon: CalendarIcon },
      { to: '/grocery', label: 'Grocery List', Icon: ShoppingBagIcon },
      { to: '/pantry', label: 'Pantry Match', Icon: LeafIcon },
    ],
  },
  {
    label: 'Ask',
    items: [{ to: '/assistant', label: 'Kitchen Assistant', Icon: SparkleIcon }],
  },
]
