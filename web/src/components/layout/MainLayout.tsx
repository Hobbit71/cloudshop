import Header from '@components/shared/Header'
import Footer from '@components/shared/Footer'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function MainLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto flex-1 p-4 sm:p-6">
        {children}
      </main>
      <Footer />
    </div>
  )
}


