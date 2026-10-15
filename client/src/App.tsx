import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Location } from 'react-router-dom'
import { backgroundFor } from './hooks/useOpenAdd'
import { RecipeProvider } from './context/RecipeContext'
import { AppDataProvider } from './lib/appData'
import { ToastProvider } from './components/ui/Toast'
import { TimerProvider } from './lib/timers'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { CookModePage } from './pages/CookModePage'
import { RecipeFormPage } from './pages/RecipeFormPage'
import { GroceryPage } from './pages/GroceryPage'
import { PlannerPage } from './pages/PlannerPage'
import { PantryPage } from './pages/PantryPage'
import { CollectionsPage } from './pages/CollectionsPage'
import { CollectionDetailPage } from './pages/CollectionDetailPage'
import { AssistantPage } from './pages/AssistantPage'
import { AddRecipeModal } from './components/recipes/AddRecipeModal'

export default function App() {
  return (
    <BrowserRouter>
      <RecipeProvider>
        <AppDataProvider>
          <ToastProvider>
          <TimerProvider>
            <Routes>
              {/* Cook mode is full screen, outside the app chrome */}
              <Route path="/recipe/:id/cook" element={<CookModePage />} />
              <Route
                path="*"
                element={
                  <Layout>
                    <MainRoutes />
                  </Layout>
                }
              />
            </Routes>
          </TimerProvider>
          </ToastProvider>
        </AppDataProvider>
      </RecipeProvider>
    </BrowserRouter>
  )
}

function MainRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const background = backgroundFor(location)
  const hasBackground = !!(location.state as { background?: Location } | null)?.background

  return (
    <>
      <Routes location={background ?? location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/favorites" element={<Navigate to="/?view=favorites" replace />} />
        <Route path="/created" element={<Navigate to="/?view=tates" replace />} />
        <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        <Route path="/edit/:id" element={<RecipeFormPage />} />
        <Route path="/grocery" element={<GroceryPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/pantry" element={<PantryPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {location.pathname === '/add' && (
        <AddRecipeModal onClose={() => (hasBackground ? navigate(-1) : navigate('/', { replace: true }))} />
      )}
    </>
  )
}
