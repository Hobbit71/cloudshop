import { api } from './client'
import { z } from 'zod'

export const paymentIntentSchema = z.object({ id: z.string(), clientSecret: z.string().optional(), status: z.string() })
export type PaymentIntent = z.infer<typeof paymentIntentSchema>

export async function createPaymentIntent(payload: { amount: number; currency: string }): Promise<PaymentIntent> {
  const res = await api.post('/payments/intents', payload)
  return paymentIntentSchema.parse(res.data)
}

export async function confirmPayment(id: string, payload: { methodId: string }): Promise<PaymentIntent> {
  const res = await api.post(`/payments/intents/${id}/confirm`, payload)
  return paymentIntentSchema.parse(res.data)
}


