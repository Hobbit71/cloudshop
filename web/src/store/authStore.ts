import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { AuthService } from '@services/api'
import { setAccessToken, setRefreshToken, clearTokens } from '@services/api/token'
import { parseError } from '@services/api/utils'

export type AuthUser = { id: string; email: string; name?: string; role?: string }

type AuthState = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error?: string
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  setupMFA: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: undefined,
        async login(email, password) {
          set((s) => { s.loading = true; s.error = undefined })
          try {
            const me = await AuthService.login({ email, password })
            // token is set by service; reflect in state via localStorage read
            const token = localStorage.getItem('cloudshop.accessToken')
            set((s) => { s.user = me as AuthUser; s.token = token; s.isAuthenticated = true })
          } catch (e) {
            const err = parseError(e)
            set((s) => { s.error = err.message })
            throw err
          } finally {
            set((s) => { s.loading = false })
          }
        },
        async register(name, email, password) {
          set((s) => { s.loading = true; s.error = undefined })
          try {
            await AuthService.register({ name, email, password })
            await get().login(email, password)
          } catch (e) {
            const err = parseError(e)
            set((s) => { s.error = err.message })
            throw err
          } finally {
            set((s) => { s.loading = false })
          }
        },
        async logout() {
          set((s) => { s.loading = true; s.error = undefined })
          try {
            await AuthService.logout()
          } finally {
            clearTokens()
            set((s) => { s.user = null; s.token = null; s.isAuthenticated = false; s.loading = false })
          }
        },
        async refreshToken() {
          try {
            // rely on axios interceptor refresh flow; calling me() will trigger if needed
            const me = await AuthService.me()
            const token = localStorage.getItem('cloudshop.accessToken')
            set((s) => { s.user = me as AuthUser; s.token = token; s.isAuthenticated = true })
          } catch (e) {
            clearTokens()
            set((s) => { s.user = null; s.token = null; s.isAuthenticated = false })
          }
        },
        async setupMFA() {
          // Minimal placeholder: endpoints assumed in pages
          // Could be expanded to return QR/secret and verification
          // No-op here; handled in dedicated UI flow
          return
        }
      })),
      {
        name: 'cloudshop.auth',
        partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
      }
    ),
    { name: 'authStore' }
  )
)

// Selectors
export const selectIsLoggedIn = (s: AuthState) => s.isAuthenticated
export const selectUserRole = (s: AuthState) => s.user?.role
export const selectUserEmail = (s: AuthState) => s.user?.email


