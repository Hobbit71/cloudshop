import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@services/api'
import Loading from '@components/common/Loading'
import { ErrorDisplay } from '@components/common/Error'
import OrderCard, { OrderItem } from '@components/feature/OrderCard'

type Order = { id: string; createdAt: string; total: number; status?: string; items: OrderItem[] }

export default function OrderDetailPage() {
  const { id } = useParams()
  const { data, isLoading, isError } = useQuery({ queryKey: ['order', id], enabled: !!id, queryFn: async () => (await api.get<Order>(`/orders/${id}`)).data })

  if (isLoading) return <Loading label="Loading order" />
  if (isError || !data) return <ErrorDisplay title="Order not found" />

  return <OrderCard id={data.id} createdAt={data.createdAt} total={data.total} items={data.items} status={data.status as any} />
}


