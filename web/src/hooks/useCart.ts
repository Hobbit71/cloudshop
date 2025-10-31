import { useCartStore } from '@store/cartStore'

/**
 * useCart
 * Cart state derived from cart store with convenience aliases.
 *
 * Example:
 * const { items, add, remove, update, checkout } = useCart()
 */
export function useCart() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total)
  const add = useCartStore((s) => s.addItem)
  const update = useCartStore((s) => s.updateQuantity)
  const remove = useCartStore((s) => s.removeItem)
  const checkout = useCartStore((s) => s.checkout)
  return { items, total, add, update, remove, checkout }
}


