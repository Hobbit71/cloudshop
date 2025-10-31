import { useEffect } from 'react'
import { useOrderStore } from '@store/orderStore'

/**
 * useOrder
 * Order list/detail operations via order store.
 *
 * Example: const { orders, fetch, cancel } = useOrder()
 */
export function useOrder() {
  const orders = useOrderStore((s) => s.orders)
  const selectedOrder = useOrderStore((s) => s.selectedOrder)
  const loading = useOrderStore((s) => s.loading)
  const error = useOrderStore((s) => s.error)
  const fetch = useOrderStore((s) => s.fetchOrders)
  const fetchDetail = useOrderStore((s) => s.fetchOrderDetail)
  const cancel = useOrderStore((s) => s.cancelOrder)

  useEffect(() => { fetch().catch(() => {}) }, [fetch])

  return { orders, selectedOrder, loading, error, fetch, fetchDetail, cancel }
}


