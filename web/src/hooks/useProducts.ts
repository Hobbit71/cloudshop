import { useEffect } from 'react'
import { useProductStore } from '@store/productStore'

/**
 * useProducts
 * Product list with loading/error from product store. Auto-fetches on mount.
 *
 * Example: const { products, loading, error, search, filter } = useProducts()
 */
export function useProducts() {
  const products = useProductStore((s) => s.filteredProducts())
  const loading = useProductStore((s) => s.loading)
  const error = useProductStore((s) => s.error)
  const fetchProducts = useProductStore((s) => s.fetchProducts)
  const search = useProductStore((s) => s.searchProducts)
  const filter = useProductStore((s) => s.setFilter)

  useEffect(() => {
    fetchProducts().catch(() => {})
  }, [fetchProducts])

  return { products, loading, error, search, filter }
}

/**
 * useProduct
 * Get a product by id from the store (ensures products fetched).
 */
export function useProduct(id?: string) {
  const fetchProducts = useProductStore((s) => s.fetchProducts)
  const productById = useProductStore((s) => s.productById)
  useEffect(() => { fetchProducts().catch(() => {}) }, [fetchProducts])
  return { product: id ? productById(id) : undefined }
}


