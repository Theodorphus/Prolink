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
  icons: {
    icon: '/Favicon.png',
    apple: '/Favicon.png',
  },
  openGraph: {
    title: 'Prolink – Sveriges marknadsplats för freelancers',
    description: 'Lägg ut uppdrag och ta emot offerter från kvalificerade freelancers. Gratis att komma igång.',
    url: 'https://prolink.se',
    siteName: 'Prolink',
    images: [
      {
        url: '/Copilot_20260430_140059.png',
        width: 1200,
        height: 630,
        alt: 'Prolink – Kopplar ihop kunder och leverantörer i Sverige',
      },
    ],
    locale: 'sv_SE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prolink – Sveriges marknadsplats för freelancers',
    description: 'Lägg ut uppdrag och ta emot offerter från kvalificerade freelancers. Gratis att komma igång.',
    images: ['/Copilot_20260430_140059.png'],
  },
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
