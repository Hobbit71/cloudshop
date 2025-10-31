import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@services/api'
import { formatCurrency } from '@utils/formatCurrency'

type Product = {
  id: string
  name: string
  price: number
}

export default function Products() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get<Product[]>('/products')
      return res.data
    }
  })

  if (isLoading) return <p>Loading products...</p>
  if (isError) return <p>Failed to load products.</p>

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data?.map((p) => (
        <Link key={p.id} to={`/products/${p.id}`} className="rounded border bg-white p-4 shadow-sm hover:shadow">
          <h2 className="font-medium">{p.name}</h2>
          <p className="text-brand">{formatCurrency(p.price)}</p>
        </Link>
      ))}
    </section>
  )
}


