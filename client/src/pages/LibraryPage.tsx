import { useRecipeContext } from '../context/RecipeContext'
import { RecipeLibrary } from '../components/recipes/RecipeLibrary'
import { PageHeader } from '../components/ui/PageHeader'

const VIEWS = {
  favorites: {
    eyebrow: 'Recipes',
    title: <>The <em>favorites</em></>,
    subtitle: 'The ones worth making again and again.',
    emptyTitle: 'No favorites yet',
    emptyMessage: 'Tap the heart on any recipe and it will show up here.',
  },
  created: {
    eyebrow: 'Recipes',
    title: <>Made by <em>Tate</em></>,
    subtitle: 'Original recipes, written and tested in my own kitchen.',
    emptyTitle: 'Nothing here yet',
    emptyMessage: 'Mark a recipe as "Created by Tate" when you add it and it will live here.',
  },
}

export function LibraryPage({ view }: { view: keyof typeof VIEWS }) {
  const { recipes, loading } = useRecipeContext()
  const v = VIEWS[view]
  const list = recipes.filter((r) => (view === 'favorites' ? r.isFavorite : r.createdByTate))

  return (
    <div>
      <PageHeader eyebrow={v.eyebrow} title={v.title} subtitle={`${v.subtitle} ${loading ? '' : `${list.length} so far.`}`} />
      <RecipeLibrary recipes={list} loading={loading} emptyTitle={v.emptyTitle} emptyMessage={v.emptyMessage} />
    </div>
  )
}
