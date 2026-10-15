import { useCallback } from 'react'
import { useLocation, useNavigate, Location } from 'react-router-dom'

/** Opens the add-recipe pop-up over whatever page is showing. */
export function useOpenAdd() {
  const navigate = useNavigate()
  const location = useLocation()
  return useCallback(() => {
    if (location.pathname === '/add') return
    navigate('/add', { state: { background: location } })
  }, [navigate, location])
}

/** The page behind a pop-up: where "+" was pressed, or home when /add is opened directly. */
export function backgroundFor(location: Location): Location | null {
  const bg = (location.state as { background?: Location } | null)?.background
  if (bg) return bg
  if (location.pathname === '/add') return { ...location, pathname: '/', search: '', state: null }
  return null
}
