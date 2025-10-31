import CartItem from '@components/feature/CartItem'
import Button from '@components/common/Button'
import { Link } from 'react-router-dom'
import { useCart } from '@hooks/useCart'

export default function CartPage() {
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
          <li key={i.id}><CartItem id={i.id} name={i.name} price={i.price} onRemove={removeItem} /></li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Total: {total}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={clear}>Clear</Button>
          <Link to="/checkout"><Button>Checkout</Button></Link>
        </div>
      </div>
    </section>
  )
}


