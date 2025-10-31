import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { ProductService } from '@services/api'
import type { Product } from '@services/api/products'
import { parseError } from '@services/api/utils'

type Filters = { q?: string }

type ProductState = {
  products: Product[]
  selectedProduct?: Product
  filters: Filters
  loading: boolean
  error?: string
  lastFetched?: number
  fetchProducts: (force?: boolean) => Promise<void>
  searchProducts: (q: string) => Promise<void>
  setFilter: (f: Partial<Filters>) => void
  clearFilter: () => void
  filteredProducts: () => Product[]
  productById: (id: string) => Product | undefined
  totalCount: () => number
}

const CACHE_TTL_MS = 30_000

export const useProductStore = create<ProductState>()(
  devtools(
    persist(
      immer((set, get) => ({
        products: [],
        selectedProduct: undefined,
        filters: {},
        loading: false,
        error: undefined,
        lastFetched: undefined,
        async fetchProducts(force = false) {
          const now = Date.now()
          const fresh = get().lastFetched && now - (get().lastFetched as number) < CACHE_TTL_MS
          if (!force && fresh && get().products.length > 0) return
          set((s) => { s.loading = true; s.error = undefined })
          try {
            const data = await ProductService.listProducts({ q: get().filters.q, page: 1, pageSize: 50 })
            set((s) => { s.products = data; s.lastFetched = Date.now() })
          } catch (e) {
            set((s) => { s.error = parseError(e).message })
          } finally {
            set((s) => { s.loading = false })
          }
        },
        async searchProducts(q) {
          set((s) => { s.filters.q = q })
          await get().fetchProducts(true)
        },
        setFilter(f) { set((s) => { s.filters = { ...s.filters, ...f } }) },
        clearFilter() { set((s) => { s.filters = {} }) },
        filteredProducts: () => {
          const q = (get().filters.q || '').toLowerCase()
          if (!q) return get().products
          return get().products.filter((p) => p.name.toLowerCase().includes(q))
        },
        productById: (id) => get().products.find((p) => p.id === id),
        totalCount: () => get().products.length
      })),
      { name: 'cloudshop.products', partialize: (s) => ({ products: s.products, lastFetched: s.lastFetched }) }
    ),
    { name: 'productStore' }
  )
)


