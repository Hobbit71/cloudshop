import { ReactNode } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

export type LayoutProps = {
  children: ReactNode
}

// Main layout with header, sidebar, and footer
// Example:
// <Layout>
//   <YourPage />
// </Layout>
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      <Navbar />
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0">
        <aside className="hidden lg:block border-r bg-white"><Sidebar /></aside>
        <main className="min-h-[60vh] bg-gray-50 p-4 sm:p-6">{children}</main>
      </div>
      <Footer />
    </div>
  )
}


