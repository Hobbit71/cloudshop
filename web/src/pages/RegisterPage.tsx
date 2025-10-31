import { z } from 'zod'
import Input from '@components/common/Input'
import Button from '@components/common/Button'
import { useRegister } from '@hooks/useAuth'

const schema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(8) })

export default function RegisterPage() {
  const mutation = useRegister()

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = { name: String(fd.get('name')||''), email: String(fd.get('email')||''), password: String(fd.get('password')||'') }
    const parsed = schema.safeParse(data)
    if (parsed.success) mutation.mutate(parsed.data)
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-semibold">Create account</h1>
      <Input name="name" label="Name" required />
      <Input name="email" label="Email" type="email" required />
      <Input name="password" label="Password" type="password" required />
      <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Creating...' : 'Create account'}</Button>
      {mutation.isError && <p className="text-sm text-red-600">Could not create account</p>}
    </form>
  )
}


