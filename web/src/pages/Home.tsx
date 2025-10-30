import { Link } from 'react-router-dom'
import Button from '@components/common/Button'

export default function Home() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome to CloudShop</h1>
      <p className="text-gray-700">Your cloud-native e-commerce platform.</p>
      <Link to="/products"><Button>Browse products</Button></Link>
    </section>
  )
}


