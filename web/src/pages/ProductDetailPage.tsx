import { useParams } from 'react-router-dom'
import { useProduct } from '@hooks/useProducts'
import Loading from '@components/common/Loading'
import { ErrorDisplay } from '@components/common/Error'
import Button from '@components/common/Button'
import { useCart } from '@hooks/useCart'
import { formatCurrency } from '@utils/formatCurrency'

export default function ProductDetailPage() {
  const { id } = useParams()
  const { data, isLoading, isError } = useProduct(id)
  const add = useCart((s) => s.addItem)

  if (isLoading) return <Loading label="Loading product" />
  if (isError || !data) return <ErrorDisplay title="Product not found" />

  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-semibold">{data.name}</h1>
      <p className="text-brand">{formatCurrency(data.price)}</p>
      {data.description && <p className="text-gray-700">{data.description}</p>}
      <Button onClick={() => add({ id: data.id, name: data.name, price: data.price })}>Add to cart</Button>
    </article>
  )
}


