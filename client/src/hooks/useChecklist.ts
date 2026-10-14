import { useEffect, useState } from 'react'

/** A set of checked ids, remembered for this browser session (e.g. ingredients you've gathered). */
export function useChecklist(key: string) {
  const [checked, setChecked] = useState<Set<string>>(() => read(key))
  useEffect(() => { setChecked(read(key)) }, [key])
  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify([...checked])) } catch { /* ignore */ }
  }, [key, checked])
  return {
    checked,
    isChecked: (id: string) => checked.has(id),
    toggle: (id: string) => setChecked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    }),
    set: (id: string, on: boolean) => setChecked((s) => {
      const n = new Set(s)
      if (on) n.add(id)
      else n.delete(id)
      return n
    }),
    clear: () => setChecked(new Set()),
  }
}

function read(key: string): Set<string> {
  try { return new Set(JSON.parse(sessionStorage.getItem(key) ?? '[]')) } catch { return new Set() }
}
