import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen, waitFor } from '@test/utils'
import userEvent from '@testing-library/user-event'
import ProductListPage from './ProductListPage'
import { createMockProducts, resetMocks, mockApi } from '@test/mocks'

describe('ProductListPage', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('renders product list', async () => {
    const products = createMockProducts(3)
    mockApi.get.mockResolvedValue({ data: products })
    render(<ProductListPage />)
    await waitFor(() => {
      expect(screen.getByText(products[0]!.name)).toBeInTheDocument()
    })
  })

  it('filters products by search query', async () => {
    const user = userEvent.setup()
    const products = createMockProducts(3)
    mockApi.get.mockResolvedValue({ data: products })
    render(<ProductListPage />)
    const searchInput = screen.getByPlaceholderText(/search products/i)
    await user.type(searchInput, 'Product 1')
    await user.click(screen.getByRole('button', { name: /apply/i }))
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('q=Product+1'),
        expect.any(Object)
      )
    })
  })
})

