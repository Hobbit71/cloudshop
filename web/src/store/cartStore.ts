import { create } from 'zustand'

export type CartItem = {
  id: string
  name: string
  price: number
}

type CartState = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clear: () => void
  total: number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item], total: get().total + item.price })),
  removeItem: (id) => set((state) => {
    const item = state.items.find((i) => i.id === id)
    const remaining = state.items.filter((i) => i.id !== id)
    return { items: remaining, total: item ? get().total - item.price : get().total }
  }),
  clear: () => set({ items: [], total: 0 }),
  total: 0
}))


