import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Location } from 'react-router-dom'
import { backgroundFor } from './hooks/useOpenAdd'
import { RecipeProvider } from './context/RecipeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
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
import { ManagePage } from './pages/ManagePage'
import { AddRecipeModal } from './components/recipes/AddRecipeModal'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  )
}

function MainRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const background = backgroundFor(location)
  const hasBackground = !!(location.state as { background?: Location } | null)?.background
  const { isAdmin, ready } = useAuth()
  // Visitors can't reach the add or edit forms; wait for a saved session before deciding
  const canEdit = isAdmin || !ready

  return (
    <>
      <Routes location={background ?? location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/favorites" element={<Navigate to="/?view=favorites" replace />} />
        <Route path="/created" element={<Navigate to="/?view=tates" replace />} />
        <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        <Route path="/edit/:id" element={canEdit ? <RecipeFormPage /> : <Navigate to="/" replace />} />
        <Route path="/grocery" element={<GroceryPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/pantry" element={<PantryPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/manage" element={canEdit ? <ManagePage /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {location.pathname === '/add' && !canEdit && <Navigate to="/" replace />}
      {location.pathname === '/add' && isAdmin && (
        <AddRecipeModal onClose={() => (hasBackground ? navigate(-1) : navigate('/', { replace: true }))} />
      )}
    </>
  )
}
