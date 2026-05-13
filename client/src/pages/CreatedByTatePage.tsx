import { useNavigate } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { RecipeGrid } from '../components/recipes/RecipeGrid'
import { Button } from '../components/ui/Button'
import styles from './Dashboard.module.css'

export function CreatedByTatePage() {
  const { recipes } = useRecipeContext()
  const navigate = useNavigate()
  const tateRecipes = recipes.filter((r) => r.createdByTate)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Created by Tate 👨‍🍳</h1>
          <p className={styles.subtitle}>
            {tateRecipes.length} original recipe{tateRecipes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/add')} icon={<span>+</span>}>
          Add Recipe
        </Button>
      </div>
      <div className={styles.content} style={{ paddingTop: 24 }}>
        <RecipeGrid
          recipes={tateRecipes}
          onAddRecipe={() => navigate('/add')}
        />
      </div>
    </div>
  )
}
