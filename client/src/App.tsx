import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RecipeProvider } from './context/RecipeContext'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { AddRecipePage } from './pages/AddRecipePage'
import { EditRecipePage } from './pages/EditRecipePage'
import { FavoritesPage } from './pages/FavoritesPage'
import { CreatedByTatePage } from './pages/CreatedByTatePage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <RecipeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recipe/:id" element={<RecipeDetailPage />} />
            <Route path="/add" element={<AddRecipePage />} />
            <Route path="/edit/:id" element={<EditRecipePage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/created" element={<CreatedByTatePage />} />
            <Route
              path="/pantry"
              element={
                <PlaceholderPage
                  title="Pantry Mode"
                  phase={4}
                  description="Enter ingredients you have on hand and get recipe recommendations from your collection, sorted by best match and fewest missing ingredients."
                />
              }
            />
            <Route
              path="/grocery"
              element={
                <PlaceholderPage
                  title="Grocery Lists"
                  phase={3}
                  description="Select one or more recipes and generate a combined grocery list, grouped by store section with check-off functionality."
                />
              }
            />
            <Route
              path="/collections"
              element={
                <PlaceholderPage
                  title="Collections"
                  phase={7}
                  description="Organize your recipes into custom collections — Summer BBQ, Christmas Baking, Sunday Dinners, or anything else."
                />
              }
            />
            <Route
              path="/planner"
              element={
                <PlaceholderPage
                  title="Meal Planner"
                  phase={7}
                  description="Plan your meals for the week by assigning recipes to days, then generate a combined grocery list for everything."
                />
              }
            />
            <Route
              path="/assistant"
              element={
                <PlaceholderPage
                  title="AI Assistant"
                  phase={6}
                  description="Chat with an AI that knows your recipe collection — scale recipes, find substitutions, get meal recommendations, and more."
                />
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </RecipeProvider>
  )
}
