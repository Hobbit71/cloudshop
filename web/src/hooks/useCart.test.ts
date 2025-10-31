import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCart } from './useCart'
import { useCartStore } from '@store/cartStore'
import { createMockProduct } from '@test/mocks'

vi.mock('@store/cartStore')

describe('useCart', () => {
  beforeEach(() => {
    vi.mocked(useCartStore).mockReturnValue({
      items: [],
      total: 0,
      addItem: vi.fn(),
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      checkout: vi.fn(),
    } as any)
  })

  it('returns cart state and actions', () => {
    const { result } = renderHook(() => useCart())
    expect(result.current).toHaveProperty('items')
    expect(result.current).toHaveProperty('total')
    expect(result.current).toHaveProperty('add')
    expect(result.current).toHaveProperty('remove')
    expect(result.current).toHaveProperty('update')
    expect(result.current).toHaveProperty('checkout')
  })

  it('adds item to cart', () => {
    const mockAdd = vi.fn()
    vi.mocked(useCartStore).mockReturnValue({
      items: [],
      total: 0,
      addItem: mockAdd,
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      checkout: vi.fn(),
    } as any)

    const { result } = renderHook(() => useCart())
    const product = createMockProduct()

    act(() => {
      result.current.add(product, 2)
    })

    expect(mockAdd).toHaveBeenCalledWith(product, 2)
  })

  it('removes item from cart', () => {
    const mockRemove = vi.fn()
    vi.mocked(useCartStore).mockReturnValue({
      items: [createMockProduct()],
      total: 99.99,
      addItem: vi.fn(),
      updateQuantity: vi.fn(),
      removeItem: mockRemove,
      checkout: vi.fn(),
    } as any)

    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.remove('1')
    })

    expect(mockRemove).toHaveBeenCalledWith('1')
  })
})

