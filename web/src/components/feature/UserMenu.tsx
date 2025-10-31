import { useState } from 'react'
import { Link } from 'react-router-dom'

export type UserMenuProps = {
  userName?: string
}

// Example: <UserMenu userName="Alex" />
export default function UserMenu({ userName = 'Guest' }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        className="rounded-full border px-3 py-1 text-sm hover:bg-gray-100"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
      >
        {userName}
      </button>
      {open && (
        <ul role="menu" className="absolute right-0 z-50 mt-2 w-40 rounded border bg-white shadow-lg">
          <li role="menuitem"><Link className="block px-3 py-2 text-sm hover:bg-gray-50" to="/account">Account</Link></li>
          <li role="menuitem"><Link className="block px-3 py-2 text-sm hover:bg-gray-50" to="/orders">Orders</Link></li>
          <li role="menuitem"><button className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Sign out</button></li>
        </ul>
      )}
    </div>
  )
}


