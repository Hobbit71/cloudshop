import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen, waitFor } from '@test/utils'
import userEvent from '@testing-library/user-event'
import LoginPage from './LoginPage'
import { resetMocks, mockApi } from '@test/mocks'
import { useAuthStore } from '@store/authStore'

vi.mock('@store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    resetMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      login: vi.fn().mockResolvedValue(undefined),
    } as any)
  })

  it('renders login form', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('submits form with email and password', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAuthStore).mockReturnValue({ login: mockLogin } as any)

    render(<LoginPage />)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('shows error on login failure', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid'))
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      loading: false,
    } as any)

    render(<LoginPage />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument()
    })
  })
})

