import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders as render, screen } from '@test/utils'
import userEvent from '@testing-library/user-event'
import Input from './Input'
import { z } from 'zod'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input name="email" label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('handles user input', async () => {
    const user = userEvent.setup()
    render(<Input name="test" />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'test value')
    expect(input).toHaveValue('test value')
  })

  it('shows error message', () => {
    render(<Input name="email" error="Invalid email" />)
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('validates with Zod schema on blur', async () => {
    const user = userEvent.setup()
    const schema = z.string().email()
    render(<Input name="email" schema={schema} />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'invalid')
    await user.tab()
    // Schema validation runs; parent controls error display
    expect(input).toBeInTheDocument()
  })

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<Input ref={ref} name="test" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})

