import { useCart } from '@hooks/useCart'
import Button from '@components/common/Button'

export default function Checkout() {
  const { items, total, clear } = useCart()

  const handlePlaceOrder = () => {
    // Placeholder for payment integration
    alert(`Order placed for ${items.length} items. Total: ${total}`)
    clear()
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="text-gray-700">Payment integration coming soon.</p>
      <Button onClick={handlePlaceOrder}>Place order</Button>
    </section>
  )
}


