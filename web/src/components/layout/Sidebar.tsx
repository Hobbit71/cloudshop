import { NavLink } from 'react-router-dom'

export type SidebarItem = { to: string; label: string }

const adminLinks: SidebarItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' }
]

// Merchant admin navigation sidebar
// Example: <Sidebar />
export default function Sidebar() {
  return (
    <nav aria-label="Sidebar" className="w-full p-4">
      <ul className="space-y-1">
        {adminLinks.map((l) => (
          <li key={l.to}>
            <NavLink
              to={l.to}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm ${isActive ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-100'}`
              }
            >
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}


