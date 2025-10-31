import { api } from './client'
import { z } from 'zod'

export const cartItemSchema = z.object({ id: z.string(), name: z.string(), price: z.number(), qty: z.number().int().positive() })
export type CartItem = z.infer<typeof cartItemSchema>

export async function getCart(): Promise<CartItem[]> {
  const res = await api.get('/cart')
  return z.array(cartItemSchema).parse(res.data)
}

export async function addToCart(item: { id: string; qty: number }): Promise<void> {
  await api.post('/cart', item)
}

export async function removeFromCart(id: string): Promise<void> {
  await api.delete(`/cart/${id}`)
}

export async function clearCart(): Promise<void> {
  await api.delete('/cart')
}


