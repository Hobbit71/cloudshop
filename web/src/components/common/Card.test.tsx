import { describe, it, expect } from 'vitest'
import { renderWithProviders as render, screen } from '@test/utils'
import Card from './Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders with title', () => {
    render(<Card title="Card Title">Content</Card>)
    expect(screen.getByText('Card Title')).toBeInTheDocument()
  })

  it('renders with actions', () => {
    render(<Card actions={<button>Action</button>}>Content</Card>)
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-card">Content</Card>)
    expect(container.firstChild).toHaveClass('custom-card')
  })

  it('has semantic role region', () => {
    render(<Card>Content</Card>)
    const card = screen.getByRole('region')
    expect(card).toBeInTheDocument()
  })
})

