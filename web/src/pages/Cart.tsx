import { useCart } from '@hooks/useCart'
import Button from '@components/common/Button'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@utils/formatCurrency'

export default function Cart() {
  const { items, removeItem, clear, total } = useCart()

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p>Your cart is empty.</p>
        <Link to="/products"><Button>Browse products</Button></Link>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-center justify-between rounded border bg-white p-3">
            <div>
              <p className="font-medium">{i.name}</p>
              <p className="text-sm text-gray-600">{formatCurrency(i.price)}</p>
            </div>
            <Button variant="secondary" onClick={() => removeItem(i.id)}>Remove</Button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Total: {formatCurrency(total)}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={clear}>Clear</Button>
          <Link to="/checkout"><Button>Checkout</Button></Link>
        </div>
      </div>
    </section>
  )
}


