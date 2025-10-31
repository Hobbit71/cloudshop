import { z } from 'zod'
import Input from '@components/common/Input'
import Button from '@components/common/Button'
import { useMutation } from '@tanstack/react-query'
import { api } from '@services/api'

const schema = z.object({ email: z.string().email() })

export default function ForgotPasswordPage() {
  const mutation = useMutation({
    mutationFn: async (email: string) => (await api.post('/auth/forgot-password', { email })).data
  })

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const parsed = schema.safeParse({ email: String(fd.get('email')||'') })
    if (parsed.success) mutation.mutate(parsed.data.email)
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-semibold">Reset password</h1>
      <Input name="email" label="Email" type="email" required />
      <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Sending...' : 'Send reset link'}</Button>
      {mutation.isSuccess && <p className="text-sm text-green-700">Check your email for a reset link.</p>}
      {mutation.isError && <p className="text-sm text-red-600">Request failed</p>}
    </form>
  )
}


