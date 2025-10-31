import { api } from './client'
import { z } from 'zod'

export const orderItemSchema = z.object({ id: z.string(), name: z.string(), price: z.number(), qty: z.number().int().positive() })
export const orderSchema = z.object({ id: z.string(), createdAt: z.string(), total: z.number(), status: z.string().optional(), items: z.array(orderItemSchema) })
export type Order = z.infer<typeof orderSchema>

export async function listOrders(): Promise<Order[]> {
  const res = await api.get('/orders')
  return z.array(orderSchema).parse(res.data)
}

export async function getOrder(id: string): Promise<Order> {
  const res = await api.get(`/orders/${id}`)
  return orderSchema.parse(res.data)
}

export async function createOrder(payload: { items: Array<{ id: string; qty: number }>; address: unknown }): Promise<Order> {
  const res = await api.post('/orders', payload)
  return orderSchema.parse(res.data)
}


