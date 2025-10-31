export type LoadingProps = { label?: string; className?: string }

// Example: <Loading label="Loading products" />
export default function Loading({ label = 'Loading...', className = '' }: LoadingProps) {
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-3 ${className}`}>
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}


