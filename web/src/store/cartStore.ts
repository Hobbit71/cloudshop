import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export type CartItem = { id: string; name: string; price: number; qty: number }

type CartState = {
  items: CartItem[]
  total: number
  itemCount: number
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  updateQuantity: (id: string, qty: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  checkout: () => Promise<void>
  // Selectors
  isEmpty: () => boolean
  subtotal: () => number
  tax: (rate?: number) => number
  grandTotal: (rate?: number) => number
}

function recalc(items: CartItem[]) {
  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0)
  const count = items.reduce((acc, i) => acc + i.qty, 0)
  return { total: subtotal, itemCount: count }
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      immer((set, get) => ({
        items: [],
        total: 0,
        itemCount: 0,
        addItem: (item, qty = 1) => set((s) => {
          const existing = s.items.find((i) => i.id === item.id)
          if (existing) existing.qty += qty
          else s.items.push({ ...item, qty })
          const { total, itemCount } = recalc(s.items)
          s.total = total
          s.itemCount = itemCount
        }),
        updateQuantity: (id, qty) => set((s) => {
          const it = s.items.find((i) => i.id === id)
          if (it) it.qty = Math.max(0, qty)
          s.items = s.items.filter((i) => i.qty > 0)
          const { total, itemCount } = recalc(s.items)
          s.total = total
          s.itemCount = itemCount
        }),
        removeItem: (id) => set((s) => {
          s.items = s.items.filter((i) => i.id !== id)
          const { total, itemCount } = recalc(s.items)
          s.total = total
          s.itemCount = itemCount
        }),
        clearCart: () => set((s) => { s.items = []; s.total = 0; s.itemCount = 0 }),
        async checkout() {
          // Integrate with OrderService/PaymentService later
          set((s) => { s.items = []; s.total = 0; s.itemCount = 0 })
        },
        isEmpty: () => get().items.length === 0,
        subtotal: () => get().items.reduce((a, i) => a + i.price * i.qty, 0),
        tax: (rate = 0.1) => get().items.reduce((a, i) => a + i.price * i.qty * rate, 0),
        grandTotal: (rate = 0.1) => get().items.reduce((a, i) => a + i.price * i.qty * (1 + rate), 0)
      })),
      { name: 'cloudshop.cart' }
    ),
    { name: 'cartStore' }
  )
)


