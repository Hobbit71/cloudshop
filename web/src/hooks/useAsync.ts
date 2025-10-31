import { useEffect, useRef, useState } from 'react'

/**
 * useAsync
 * Generic async data hook with cancellation safety.
 *
 * Example: const { data, loading, error } = useAsync(() => fetchUser(id), [id])
 */
export function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(undefined)
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    setLoading(true)
    setError(undefined)
    fn()
      .then((res) => { if (!cancelled.current) setData(res) })
      .catch((e) => { if (!cancelled.current) setError(e) })
      .finally(() => { if (!cancelled.current) setLoading(false) })
    return () => { cancelled.current = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}


