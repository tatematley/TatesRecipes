import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase, isDemo } from '../lib/supabase'

const DEMO_KEY = 'tt:demo-admin'

interface ContextValue {
  /** Signed in: can add, edit and delete recipes. */
  isAdmin: boolean
  /** False until a saved session has been checked. */
  ready: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<ContextValue | null>(null)

function readDemo() {
  try { return localStorage.getItem(DEMO_KEY) === '1' } catch { return false }
}

/**
 * One admin account, signed in with Supabase Auth. In demo mode (no Supabase)
 * any email and password works, remembered in this browser.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(isDemo ? readDemo() : false)
  const [ready, setReady] = useState(isDemo)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(!!data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setIsAdmin(!!session))
    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      try { localStorage.setItem(DEMO_KEY, '1') } catch { /* private window */ }
      setIsAdmin(true)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) {
      try { localStorage.removeItem(DEMO_KEY) } catch { /* private window */ }
      setIsAdmin(false)
      return
    }
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider value={{ isAdmin, ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): ContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
