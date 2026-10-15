import React, { createContext, useCallback, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import styles from './Toast.module.css'
import { CheckIcon } from './Icons'

interface ToastItem { id: number; message: string; action?: { label: string; to?: string; onClick?: () => void } }

const ToastCtx = createContext<(message: string, action?: ToastItem['action']) => void>(() => {})

let counter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const navigate = useNavigate()

  const show = useCallback((message: string, action?: ToastItem['action']) => {
    const id = ++counter
    setItems((list) => [...list.slice(-2), { id, message, action }])
    window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4200)
  }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {createPortal(
        <div className={styles.stack} role="status" aria-live="polite">
          {items.map((t) => (
            <div key={t.id} className={styles.toast}>
              <span className={styles.check}><CheckIcon size={13} strokeWidth={2.5} /></span>
              <span className={styles.msg}>{t.message}</span>
              {t.action && (
                <button
                  className={styles.action}
                  onClick={() => {
                    t.action!.onClick?.()
                    if (t.action!.to) navigate(t.action!.to)
                    setItems((list) => list.filter((x) => x.id !== t.id))
                  }}
                >
                  {t.action.label}
                </button>
              )}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  )
}

/** const toast = useToast(); toast('Saved', { label: 'View', to: '/grocery' }) */
export function useToast() {
  return useContext(ToastCtx)
}
