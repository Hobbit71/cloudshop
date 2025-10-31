export type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

// Example:
// <Pagination page={1} pageSize={20} total={120} onChange={setPage} />
export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <nav className="flex items-center gap-2" aria-label="Pagination">
      <button
        className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        aria-label="Previous page"
        disabled={!canPrev}
        onClick={() => canPrev && onChange(page - 1)}
      >
        Prev
      </button>
      <span className="text-sm text-gray-700" aria-live="polite">Page {page} of {totalPages}</span>
      <button
        className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        aria-label="Next page"
        disabled={!canNext}
        onClick={() => canNext && onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  )
}


