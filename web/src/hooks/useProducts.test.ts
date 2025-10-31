import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProducts } from './useProducts'
import { useProductStore } from '@store/productStore'
import { createMockProducts } from '@test/mocks'

vi.mock('@store/productStore', () => ({
  useProductStore: vi.fn(),
}))

describe('useProducts', () => {
  const mockProducts = createMockProducts(3)

  beforeEach(() => {
    vi.mocked(useProductStore).mockReturnValue({
      filteredProducts: () => mockProducts,
      loading: false,
      error: undefined,
      fetchProducts: vi.fn().mockResolvedValue(undefined),
      searchProducts: vi.fn(),
      setFilter: vi.fn(),
    } as any)
  })

  it('returns products and actions', () => {
    const { result } = renderHook(() => useProducts())
    expect(result.current.products).toEqual(mockProducts)
    expect(result.current.loading).toBe(false)
    expect(result.current).toHaveProperty('search')
    expect(result.current).toHaveProperty('filter')
  })

  it('calls fetchProducts on mount', async () => {
    const mockFetch = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useProductStore).mockReturnValue({
      filteredProducts: () => [],
      loading: false,
      error: undefined,
      fetchProducts: mockFetch,
      searchProducts: vi.fn(),
      setFilter: vi.fn(),
    } as any)

    renderHook(() => useProducts())

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  it('handles search action', () => {
    const mockSearch = vi.fn()
    vi.mocked(useProductStore).mockReturnValue({
      filteredProducts: () => mockProducts,
      loading: false,
      error: undefined,
      fetchProducts: vi.fn(),
      searchProducts: mockSearch,
      setFilter: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProducts())

    result.current.search('test query')
    expect(mockSearch).toHaveBeenCalledWith('test query')
  })
})

