export default function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 sm:px-6 py-6 text-sm text-gray-600">
        © {new Date().getFullYear()} CloudShop. All rights reserved.
      </div>
    </footer>
  )
}


