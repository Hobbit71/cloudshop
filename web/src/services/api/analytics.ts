import { api } from './client'
import { z } from 'zod'

export const metricsSchema = z.object({ revenue: z.number(), orders: z.number(), customers: z.number() })
export type Metrics = z.infer<typeof metricsSchema>

export async function getMetrics(): Promise<Metrics> {
  const res = await api.get('/admin/metrics')
  return metricsSchema.parse(res.data)
}


