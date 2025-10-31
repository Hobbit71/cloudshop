import { useState } from 'react'
import { z } from 'zod'
import { useProducts } from '@hooks/useProducts'
import ProductCard from '@components/feature/ProductCard'
import Loading from '@components/common/Loading'
import { ErrorDisplay } from '@components/common/Error'
import Pagination from '@components/common/Pagination'
import Input from '@components/common/Input'

const filterSchema = z.object({ q: z.string().optional() })

export default function ProductListPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const { data, isLoading, isError } = useProducts({ q, page, pageSize: 12 })

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const parsed = filterSchema.safeParse({ q: String(form.get('q') || '') })
    if (parsed.success) setQ(parsed.data.q || '')
  }

  return (
    <section className="space-y-4">
      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <Input name="q" label="Search" placeholder="Search products" defaultValue={q} />
        <button className="rounded bg-brand px-3 py-2 text-white">Apply</button>
      </form>

      {isLoading && <Loading label="Loading products" />}
      {isError && <ErrorDisplay title="Failed to load products" />}

      {!isLoading && !isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.map((p) => (
              <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} />
            ))}
          </div>
          <Pagination page={page} pageSize={12} total={200} onChange={setPage} />
        </>
      )}
    </section>
  )
}


