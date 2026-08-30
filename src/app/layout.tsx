import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import NavbarWrapper from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import { Analytics } from '@vercel/analytics/next'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://prolink.se'),
  title: { default: 'Prolink', template: '%s | Prolink' },
  description: 'Hitta enkla jobb i Göteborg – snabbt och gratis.',
  icons: {
    icon: '/Favicon.png',
    apple: '/Favicon.png',
  },
  openGraph: {
    title: 'Prolink – Jobb i Göteborg',
    description: 'Hitta enkla jobb i Göteborg – snabbt och gratis.',
    url: 'https://prolink.se',
    siteName: 'Prolink',
    images: [
      {
        url: '/Copilot_20260430_140059.png',
        width: 1200,
        height: 630,
        alt: 'Prolink – Jobb i Göteborg',
      },
    ],
    locale: 'sv_SE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prolink – Jobb i Göteborg',
    description: 'Hitta enkla jobb i Göteborg – snabbt och gratis.',
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
        <Analytics />
      </body>
    </html>
  )
}
