import { ReactNode } from 'react'

export type CardProps = {
  children: ReactNode
  title?: string
  actions?: ReactNode
  role?: string
  className?: string
}

// Example:
// <Card title="Summary" actions={<button>Action</button>}>Content</Card>
export default function Card({ children, title, actions, role = 'region', className = '' }: CardProps) {
  return (
    <section role={role} className={`rounded-lg border bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between border-b px-4 py-3">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}


