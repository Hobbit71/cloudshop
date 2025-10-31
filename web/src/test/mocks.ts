import { vi } from 'vitest'
import type { Product } from '@services/api/products'
import type { Order } from '@services/api/orders'

// Mock API client
export const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@services/api/client', () => ({
  api: mockApi,
}))

// Test data factories
export function createMockProduct(overrides?: Partial<Product>): Product {
  return {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    description: 'Test description',
    ...overrides,
  }
}

export function createMockProducts(count = 3): Product[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProduct({
      id: String(i + 1),
      name: `Product ${i + 1}`,
      price: (i + 1) * 10,
    })
  )
}

export function createMockOrder(overrides?: Partial<Order>): Order {
  return {
    id: 'order-1',
    createdAt: new Date().toISOString(),
    total: 99.99,
    status: 'pending',
    items: [{ id: '1', name: 'Product', price: 99.99, qty: 1 }],
    ...overrides,
  }
}

export function resetMocks() {
  mockApi.get.mockReset()
  mockApi.post.mockReset()
  mockApi.put.mockReset()
  mockApi.delete.mockReset()
}

