import { api } from './client'
import { z } from 'zod'

export const customerSchema = z.object({ id: z.string(), email: z.string().email(), name: z.string().optional() })
export type Customer = z.infer<typeof customerSchema>

export async function getMe(): Promise<Customer> {
  const res = await api.get('/me')
  return customerSchema.parse(res.data)
}

export async function updateMe(payload: Partial<Omit<Customer, 'id'>>): Promise<Customer> {
  const res = await api.put('/me', payload)
  return customerSchema.parse(res.data)
}


