import { useQuery } from '@tanstack/react-query'
import { api } from '@services/api'
import Loading from '@components/common/Loading'
import { ErrorDisplay } from '@components/common/Error'
import OrderCard, { OrderItem } from '@components/feature/OrderCard'

type Order = { id: string; createdAt: string; total: number; status?: string; items: OrderItem[] }

export default function OrderHistoryPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['orders'], queryFn: async () => (await api.get<Order[]>('/orders')).data })

  if (isLoading) return <Loading label="Loading orders" />
  if (isError) return <ErrorDisplay title="Failed to load orders" />

  return (
    <section className="space-y-3">
      <h1 className="text-xl font-semibold">Order History</h1>
      <div className="grid gap-4">{data?.map((o) => <OrderCard key={o.id} id={o.id} createdAt={o.createdAt} total={o.total} items={o.items} status={o.status as any} />)}</div>
    </section>
  )
}


