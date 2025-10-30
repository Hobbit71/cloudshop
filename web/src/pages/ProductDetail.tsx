import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@services/api'
import Button from '@components/common/Button'
import { useCart } from '@hooks/useCart'
import { formatCurrency } from '@utils/formatCurrency'

type Product = {
  id: string
  name: string
  price: number
  description?: string
}

export default function ProductDetail() {
  const { id } = useParams()
  const addToCart = useCart((s) => s.addItem)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get<Product>(`/products/${id}`)
      return res.data
    }
  })

  if (isLoading) return <p>Loading product...</p>
  if (isError || !data) return <p>Product not found.</p>

  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-semibold">{data.name}</h1>
      <p className="text-brand">{formatCurrency(data.price)}</p>
      {data.description && <p className="text-gray-700">{data.description}</p>}
      <Button onClick={() => addToCart({ id: data.id, name: data.name, price: data.price })}>
        Add to cart
      </Button>
    </article>
  )
}


