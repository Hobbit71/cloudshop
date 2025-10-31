import Input from '@components/common/Input'
import Button from '@components/common/Button'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { api } from '@services/api'

const schema = z.object({ storeName: z.string().min(1), currency: z.string().min(1) })

export default function SettingsPage() {
  const mutation = useMutation({ mutationFn: async (payload: z.infer<typeof schema>) => (await api.put('/admin/settings', payload)).data })

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const parsed = schema.safeParse({ storeName: String(fd.get('storeName')||''), currency: String(fd.get('currency')||'') })
    if (parsed.success) mutation.mutate(parsed.data)
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Store Settings</h1>
      <Input name="storeName" label="Store name" defaultValue="CloudShop" required />
      <Input name="currency" label="Currency" defaultValue="USD" required />
      <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save'}</Button>
      {mutation.isSuccess && <p className="text-sm text-green-700">Saved.</p>}
      {mutation.isError && <p className="text-sm text-red-600">Save failed</p>}
    </form>
  )
}


