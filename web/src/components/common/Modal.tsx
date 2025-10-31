import { ReactNode, useEffect } from 'react'

export type ModalProps = {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
}

// Accessible modal dialog; traps focus minimally via aria attributes
// Example:
// <Modal open={open} onClose={()=>setOpen(false)} title="Confirm">...</Modal>
export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white shadow-lg">
        {title && <header className="border-b px-4 py-3 text-lg font-medium">{title}</header>}
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}


