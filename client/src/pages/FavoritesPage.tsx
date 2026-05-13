import { useNavigate } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { RecipeGrid } from '../components/recipes/RecipeGrid'
import { Button } from '../components/ui/Button'
import styles from './Dashboard.module.css'

export function FavoritesPage() {
  const { recipes } = useRecipeContext()
  const navigate = useNavigate()
  const favorites = recipes.filter((r) => r.isFavorite)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Favorites ★</h1>
          <p className={styles.subtitle}>
            {favorites.length} recipe{favorites.length !== 1 ? 's' : ''} starred
          </p>
        </div>
        <Button onClick={() => navigate('/add')} icon={<span>+</span>}>
          Add Recipe
        </Button>
      </div>
      <div className={styles.content} style={{ paddingTop: 24 }}>
        <RecipeGrid
          recipes={favorites}
          onAddRecipe={() => navigate('/')}
        />
      </div>
    </div>
  )
}
