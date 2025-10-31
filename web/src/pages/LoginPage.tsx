import { z } from 'zod'
import Input from '@components/common/Input'
import Button from '@components/common/Button'
import { useLogin } from '@hooks/useAuth'

const schema = z.object({ email: z.string().email(), password: z.string().min(8) })

export default function LoginPage() {
  const login = useLogin()

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = { email: String(fd.get('email')||''), password: String(fd.get('password')||'') }
    const parsed = schema.safeParse(data)
    if (parsed.success) login.mutate(parsed.data)
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <Input name="email" label="Email" type="email" required />
      <Input name="password" label="Password" type="password" required />
      <Button type="submit" disabled={login.isPending}>{login.isPending ? 'Signing in...' : 'Sign in'}</Button>
      {login.isError && <p className="text-sm text-red-600">Invalid credentials</p>}
    </form>
  )
}


