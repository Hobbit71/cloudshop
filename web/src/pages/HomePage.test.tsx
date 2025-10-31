import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen, waitFor } from '@test/utils'
import HomePage from './HomePage'
import { createMockProducts, resetMocks, mockApi } from '@test/mocks'

describe('HomePage', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('renders loading state initially', () => {
    mockApi.get.mockImplementation(() => new Promise(() => {}))
    render(<HomePage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders featured products', async () => {
    const products = createMockProducts(4)
    mockApi.get.mockResolvedValue({ data: products })
    render(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText(products[0]!.name)).toBeInTheDocument()
    })
  })

  it('renders error state on failure', async () => {
    mockApi.get.mockRejectedValue(new Error('Failed'))
    render(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })
})

