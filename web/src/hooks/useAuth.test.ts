import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'
import { useAuthStore } from '@store/authStore'

vi.mock('@store/authStore', () => ({
  useAuthStore: vi.fn(),
  selectIsLoggedIn: vi.fn((s: any) => s.isAuthenticated),
  selectUserEmail: vi.fn((s: any) => s.user?.email),
}))

describe('useAuth', () => {
  const mockUser = { id: '1', email: 'test@example.com', name: 'Test' }

  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshToken: vi.fn().mockResolvedValue(undefined),
    } as any)
  })

  it('returns auth state and actions', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isLoggedIn).toBe(true)
    expect(result.current).toHaveProperty('login')
    expect(result.current).toHaveProperty('logout')
    expect(result.current).toHaveProperty('register')
  })

  it('calls refreshToken on mount', async () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshToken: mockRefresh,
    } as any)

    renderHook(() => useAuth())

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('handles login action', () => {
    const mockLogin = vi.fn()
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
      register: vi.fn(),
      refreshToken: vi.fn(),
    } as any)

    const { result } = renderHook(() => useAuth())

    result.current.login('test@example.com', 'password123')
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
  })
})

