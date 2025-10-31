import { useSearchParams, Link } from 'react-router-dom'

export default function OrderConfirmationPage() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Thank you for your order!</h1>
      <p className="text-gray-700">Your order {orderId ? `#${orderId}` : ''} has been placed successfully.</p>
      <Link to="/orders" className="text-brand hover:underline">View orders</Link>
    </section>
  )
}


