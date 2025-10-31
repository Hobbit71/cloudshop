import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders as render, screen } from '@test/utils'
import userEvent from '@testing-library/user-event'
import Modal from './Modal'

describe('Modal', () => {
  it('does not render when open is false', () => {
    render(<Modal open={false} onClose={vi.fn()}>Content</Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders when open is true', () => {
    render(<Modal open={true} onClose={vi.fn()}>Content</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Modal Title">Content</Modal>)
    expect(screen.getByText('Modal Title')).toBeInTheDocument()
  })

  it('calls onClose when clicking overlay', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose}>Content</Modal>)
    const overlay = screen.getByRole('dialog').parentElement
    if (overlay) {
      await user.click(overlay.firstElementChild || overlay)
    }
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose on Escape key', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose}>Content</Modal>)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})

