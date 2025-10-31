import { useEffect, useRef } from 'react'

/**
 * usePrevious
 * Returns the previous value of a dependency.
 */
export function usePrevious<T>(value: T) {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => { ref.current = value }, [value])
  return ref.current
}


