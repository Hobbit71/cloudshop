import { z } from 'zod'
import Input from '@components/common/Input'
import Button from '@components/common/Button'
import { useCurrentUser } from '@hooks/useAuth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@services/api'

const schema = z.object({ name: z.string().min(1), email: z.string().email() })

export default function ProfilePage() {
  const { data: user } = useCurrentUser()
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (payload: z.infer<typeof schema>) => (await api.put('/me', payload)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['me'] }) }
  })

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = { name: String(fd.get('name')||''), email: String(fd.get('email')||'') }
    const parsed = schema.safeParse(data)
    if (parsed.success) mutation.mutate(parsed.data)
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Profile</h1>
      <Input name="name" label="Name" defaultValue={user?.name} required />
      <Input name="email" label="Email" type="email" defaultValue={user?.email} required />
      <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save changes'}</Button>
      {mutation.isSuccess && <p className="text-sm text-green-700">Saved.</p>}
      {mutation.isError && <p className="text-sm text-red-600">Update failed</p>}
    </form>
  )
}


