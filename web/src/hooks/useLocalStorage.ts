import { useCallback, useEffect, useState } from 'react'

/**
 * useLocalStorage
 * Typed state synchronized with localStorage.
 *
 * Example: const [token, setToken] = useLocalStorage<string>('token', '')
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const read = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initialValue
    } catch {
      return initialValue
    }
  }, [initialValue, key])

  const [value, setValue] = useState<T>(read)

  useEffect(() => { setValue(read()) }, [read])

  const setStoredValue = useCallback((val: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
      return next
    })
  }, [key])

  return [value, setStoredValue] as const
}


