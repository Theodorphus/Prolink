import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import NavbarWrapper from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Prolink', template: '%s | Prolink' },
  description: 'Koppla samman kunder och leverantörer i Sverige.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={`${inter.className} antialiased bg-gray-50 min-h-screen flex flex-col`}>
        <NavbarWrapper>
          <Navbar />
        </NavbarWrapper>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
