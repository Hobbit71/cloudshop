import { useQuery } from '@tanstack/react-query'
import { api } from '@services/api'
import Card from '@components/common/Card'

type AdminOrder = { id: string; customer: string; total: number; status: string }

export default function OrderManagementPage() {
  const { data } = useQuery({ queryKey: ['admin-orders'], queryFn: async () => (await api.get<AdminOrder[]>('/admin/orders')).data })
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Orders</h1>
      <div className="grid gap-3">
        {data?.map((o) => (
          <Card key={o.id} title={`Order #${o.id}`} actions={<button className="text-sm text-brand">Update</button>}>
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>{o.customer}</span>
              <span>${o.total.toFixed(2)}</span>
              <span className="capitalize">{o.status}</span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}


