import Card from '@components/common/Card'
import { formatCurrency } from '@utils/formatCurrency'

export type OrderItem = { id: string; name: string; price: number; qty: number }

export type OrderCardProps = {
  id: string
  createdAt: string | Date
  total: number
  items: OrderItem[]
  status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
}

// Example:
// <OrderCard id="o1" createdAt={new Date()} total={99.99} items={[...]} />
export default function OrderCard({ id, createdAt, total, items, status = 'pending' }: OrderCardProps) {
  const dateStr = typeof createdAt === 'string' ? new Date(createdAt).toLocaleString() : createdAt.toLocaleString()
  return (
    <Card title={`Order #${id}`}>
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Placed: {dateStr}</p>
        <p className="text-sm">Status: <span className="font-medium capitalize">{status}</span></p>
        <ul className="divide-y rounded border bg-white">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{i.name} × {i.qty}</span>
              <span>{formatCurrency(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="text-right text-base font-semibold">Total: {formatCurrency(total)}</p>
      </div>
    </Card>
  )
}


