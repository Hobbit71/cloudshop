import { useState } from 'react'
import { z } from 'zod'
import Input from '@components/common/Input'
import Button from '@components/common/Button'
import { useCart } from '@hooks/useCart'
import { useMutation } from '@tanstack/react-query'
import { api } from '@services/api'
import { useNavigate } from 'react-router-dom'

const addressSchema = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1)
})

export default function CheckoutPage() {
  const { items, total, clear } = useCart()
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const orderMutation = useMutation({
    mutationFn: async (payload: unknown) => (await api.post('/orders', payload)).data,
    onSuccess: (res) => { clear(); navigate(`/order-confirmation?orderId=${res?.id || ''}`) }
  })

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = {
      name: String(fd.get('name') || ''),
      line1: String(fd.get('line1') || ''),
      city: String(fd.get('city') || ''),
      country: String(fd.get('country') || '')
    }
    const parsed = addressSchema.safeParse(data)
    if (parsed.success) {
      setStep(2)
      orderMutation.mutate({ items, address: parsed.data, total })
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      {step === 1 && (
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <Input name="name" label="Full name" required />
          <Input name="line1" label="Address" required className="sm:col-span-2" />
          <Input name="city" label="City" required />
          <Input name="country" label="Country" required />
          <div className="sm:col-span-2">
            <Button type="submit">Continue to payment</Button>
          </div>
        </form>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p>Processing payment...</p>
          <p className="text-sm text-gray-600">This is a demo step; integrate a real gateway later.</p>
        </div>
      )}
    </section>
  )
}


