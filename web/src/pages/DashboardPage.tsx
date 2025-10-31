import Card from '@components/common/Card'
import { useQuery } from '@tanstack/react-query'
import { api } from '@services/api'
import Loading from '@components/common/Loading'
import { ErrorDisplay } from '@components/common/Error'

type Metrics = { revenue: number; orders: number; customers: number }

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['metrics'], queryFn: async () => (await api.get<Metrics>('/admin/metrics')).data })

  if (isLoading) return <Loading label="Loading metrics" />
  if (isError || !data) return <ErrorDisplay title="Failed to load metrics" />

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <Card title="Revenue">
        <p className="text-2xl font-semibold">${data.revenue.toLocaleString()}</p>
      </Card>
      <Card title="Orders">
        <p className="text-2xl font-semibold">{data.orders.toLocaleString()}</p>
      </Card>
      <Card title="Customers">
        <p className="text-2xl font-semibold">{data.customers.toLocaleString()}</p>
      </Card>
    </section>
  )
}


