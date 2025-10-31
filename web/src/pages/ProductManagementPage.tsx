import { useProducts } from '@hooks/useProducts'
import Card from '@components/common/Card'
import Button from '@components/common/Button'

export default function ProductManagementPage() {
  const { data } = useProducts({ page: 1, pageSize: 50 })
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Button>Add product</Button>
      </div>
      <div className="grid gap-3">
        {data?.map((p) => (
          <Card key={p.id} title={p.name} actions={<Button variant="secondary">Edit</Button>}>
            <p>${p.price}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}


