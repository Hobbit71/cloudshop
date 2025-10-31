import { useCallback, useMemo, useState } from 'react'

/**
 * usePagination
 * Generic pagination logic.
 *
 * Example: const { currentPage, nextPage } = usePagination({ total, pageSize: 20 })
 */
export function usePagination({ total, pageSize = 20, initialPage = 1 }: { total: number; pageSize?: number; initialPage?: number }) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])
  const goToPage = useCallback((p: number) => setCurrentPage(Math.min(totalPages, Math.max(1, p))), [totalPages])
  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])
  return { currentPage, totalPages, goToPage, nextPage, prevPage }
}


