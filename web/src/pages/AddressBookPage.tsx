import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@services/api'
import Input from '@components/common/Input'
import Button from '@components/common/Button'
import { z } from 'zod'

type Address = { id: string; name: string; line1: string; city: string; country: string }

const schema = z.object({ name: z.string().min(1), line1: z.string().min(1), city: z.string().min(1), country: z.string().min(1) })

export default function AddressBookPage() {
  const qc = useQueryClient()
  const list = useQuery({ queryKey: ['addresses'], queryFn: async () => (await api.get<Address[]>('/me/addresses')).data })
  const create = useMutation({
    mutationFn: async (payload: z.infer<typeof schema>) => (await api.post('/me/addresses', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] })
  })

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = { name: String(fd.get('name')||''), line1: String(fd.get('line1')||''), city: String(fd.get('city')||''), country: String(fd.get('country')||'') }
    const parsed = schema.safeParse(data)
    if (parsed.success) create.mutate(parsed.data)
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Address Book</h1>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <Input name="name" label="Name" required />
        <Input name="line1" label="Address" required className="sm:col-span-2" />
        <Input name="city" label="City" required />
        <Input name="country" label="Country" required />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Adding...' : 'Add address'}</Button>
        </div>
      </form>
      <ul className="divide-y rounded border bg-white">
        {list.data?.map((a) => (
          <li key={a.id} className="px-3 py-2 text-sm">{a.name} — {a.line1}, {a.city}, {a.country}</li>
        ))}
      </ul>
    </section>
  )
}


