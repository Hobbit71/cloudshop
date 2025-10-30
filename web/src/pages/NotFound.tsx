import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-gray-700">The page you are looking for does not exist.</p>
      <Link to="/" className="text-brand hover:underline">Go home</Link>
    </section>
  )
}


