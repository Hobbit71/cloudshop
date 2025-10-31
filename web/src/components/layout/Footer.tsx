export default function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 sm:px-6 py-6 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} CloudShop</p>
        <nav aria-label="Footer" className="flex gap-4">
          <a className="hover:text-brand" href="#" aria-label="Privacy Policy">Privacy</a>
          <a className="hover:text-brand" href="#" aria-label="Terms of Service">Terms</a>
          <a className="hover:text-brand" href="#" aria-label="Contact">Contact</a>
        </nav>
      </div>
    </footer>
  )
}


