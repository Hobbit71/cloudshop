import { api } from './client'
import { z } from 'zod'
import { buildQueryString } from './utils'

export const productSchema = z.object({ id: z.string(), name: z.string(), price: z.number(), description: z.string().optional() })
export type Product = z.infer<typeof productSchema>

export async function listProducts(params: { q?: string; page?: number; pageSize?: number } = {}): Promise<Product[]> {
  const qs = buildQueryString(params)
  const res = await api.get(`/products${qs}`)
  return z.array(productSchema).parse(res.data)
}

export async function getProduct(id: string): Promise<Product> {
  const res = await api.get(`/products/${id}`)
  return productSchema.parse(res.data)
}

export async function createProduct(payload: Omit<Product, 'id'>): Promise<Product> {
  const res = await api.post('/products', payload)
  return productSchema.parse(res.data)
}

export async function updateProduct(id: string, payload: Partial<Omit<Product, 'id'>>): Promise<Product> {
  const res = await api.put(`/products/${id}`, payload)
  return productSchema.parse(res.data)
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`)
}


