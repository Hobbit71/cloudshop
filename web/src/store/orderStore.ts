import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { OrderService } from '@services/api'
import type { Order } from '@services/api/orders'
import { parseError } from '@services/api/utils'

type OrderState = {
  orders: Order[]
  selectedOrder?: Order
  loading: boolean
  error?: string
  fetchOrders: () => Promise<void>
  fetchOrderDetail: (id: string) => Promise<void>
  cancelOrder: (id: string) => Promise<void>
  ordersByStatus: (status: string) => Order[]
  orderById: (id: string) => Order | undefined
}

export const useOrderStore = create<OrderState>()(
  devtools(
    persist(
      immer((set, get) => ({
        orders: [],
        selectedOrder: undefined,
        loading: false,
        error: undefined,
        async fetchOrders() {
          set((s) => { s.loading = true; s.error = undefined })
          try {
            const data = await OrderService.listOrders()
            set((s) => { s.orders = data })
          } catch (e) {
            set((s) => { s.error = parseError(e).message })
          } finally {
            set((s) => { s.loading = false })
          }
        },
        async fetchOrderDetail(id) {
          set((s) => { s.loading = true; s.error = undefined })
          try {
            const data = await OrderService.getOrder(id)
            set((s) => { s.selectedOrder = data })
          } catch (e) {
            set((s) => { s.error = parseError(e).message })
          } finally {
            set((s) => { s.loading = false })
          }
        },
        async cancelOrder(id) {
          // Placeholder: call backend cancel endpoint if available
          set((s) => { s.orders = s.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)) })
        },
        ordersByStatus: (status) => get().orders.filter((o) => o.status === status),
        orderById: (id) => get().orders.find((o) => o.id === id)
      })),
      { name: 'cloudshop.orders', partialize: (s) => ({ orders: s.orders }) }
    ),
    { name: 'orderStore' }
  )
)


