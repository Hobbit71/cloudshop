import { useEffect } from 'react'
import { useAuthStore, selectIsLoggedIn, selectUserEmail } from '@store/authStore'

/**
 * useAuth
 * Provides authentication state and actions from the auth store.
 * - Auto-refreshes token/user on mount
 *
 * Example:
 * const { user, isLoggedIn, login, logout } = useAuth()
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const isLoggedIn = useAuthStore(selectIsLoggedIn)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const register = useAuthStore((s) => s.register)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  useEffect(() => {
    refreshToken().catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { user, isLoggedIn, login, logout, register }
}


