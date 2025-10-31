import { Link } from 'react-router-dom'
import UserMenu from '@components/feature/UserMenu'

export type NavbarProps = {
  onSearch?: (q: string) => void
}

// Header with logo, search, and user menu
// Example: <Navbar onSearch={(q)=>console.log(q)} />
export default function Navbar({ onSearch }: NavbarProps) {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Link to="/" aria-label="CloudShop home" className="text-xl font-semibold text-brand">CloudShop</Link>
          <form
            role="search"
            aria-label="Search products"
            className="hidden md:flex items-center gap-2 flex-1 max-w-xl"
            onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); onSearch?.(String(fd.get('q') || '')) }}
          >
            <input
              name="q"
              type="search"
              placeholder="Search products..."
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-brand/30"
              aria-label="Search"
            />
            <button type="submit" className="rounded bg-brand px-3 py-2 text-white">Search</button>
          </form>
        </div>
        <nav className="flex items-center gap-4" aria-label="Primary">
          <Link to="/products" className="text-gray-700 hover:text-brand">Products</Link>
          <Link to="/cart" className="text-gray-700 hover:text-brand" aria-label="View cart">Cart</Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  )
}


