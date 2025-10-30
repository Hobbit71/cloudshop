import { Link, NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold text-brand">CloudShop</Link>
        <nav className="flex gap-4">
          <NavLink to="/products" className={({ isActive }) => isActive ? 'text-brand font-medium' : 'text-gray-700 hover:text-brand'}>Products</NavLink>
          <NavLink to="/cart" className={({ isActive }) => isActive ? 'text-brand font-medium' : 'text-gray-700 hover:text-brand'}>Cart</NavLink>
        </nav>
      </div>
    </header>
  )
}


