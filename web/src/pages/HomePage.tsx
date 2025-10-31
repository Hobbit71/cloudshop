import { useProducts } from '@hooks/useProducts'
import ProductCard from '@components/feature/ProductCard'
import Loading from '@components/common/Loading'
import { ErrorDisplay } from '@components/common/Error'
import { useCart } from '@hooks/useCart'

export default function HomePage() {
  const { data, isLoading, isError } = useProducts({ page: 1, pageSize: 8 })
  const add = useCart((s) => s.addItem)

  if (isLoading) return <Loading label="Loading featured products" />
  if (isError) return <ErrorDisplay title="Failed to load products" />

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {data?.map((p) => (
        <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} onAddToCart={() => add({ id: p.id, name: p.name, price: p.price })} />
      ))}
    </section>
  )
}


