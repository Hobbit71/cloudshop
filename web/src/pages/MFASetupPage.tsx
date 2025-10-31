import { useMutation } from '@tanstack/react-query'
import { api } from '@services/api'
import Button from '@components/common/Button'

export default function MFASetupPage() {
  const start = useMutation({ mutationFn: async () => (await api.post('/auth/mfa/start')).data })
  const verify = useMutation({ mutationFn: async (code: string) => (await api.post('/auth/mfa/verify', { code })).data })

  const onVerify: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    verify.mutate(String(fd.get('code') || ''))
  }

  return (
    <section className="space-y-3">
      <h1 className="text-xl font-semibold">Set up multi-factor authentication</h1>
      <Button onClick={() => start.mutate()} disabled={start.isPending}>{start.isPending ? 'Generating...' : 'Generate secret'}</Button>
      <form onSubmit={onVerify} className="flex gap-2">
        <input name="code" className="w-40 rounded border px-3 py-2" placeholder="Enter code" aria-label="MFA code" />
        <Button type="submit" disabled={verify.isPending}>{verify.isPending ? 'Verifying...' : 'Verify'}</Button>
      </form>
      {verify.isSuccess && <p className="text-sm text-green-700">MFA enabled</p>}
      {(start.isError || verify.isError) && <p className="text-sm text-red-600">MFA setup failed</p>}
    </section>
  )
}


