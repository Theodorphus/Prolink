import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import NavbarWrapper from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import { Analytics } from "@vercel/analytics/react"


const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-heading', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://prolink.se'),
  title: { default: 'Prolink', template: '%s | Prolink' },
  description: 'Hitta frilansare, tjänster och uppdrag inom webb, design, marknadsföring, redovisning och IT.',
  icons: {
    icon: '/Favicon.png',
    apple: '/Favicon.png',
  },
  openGraph: {
    title: 'Prolink – där företag och frilansare möts',
    description: 'Hitta rätt specialist för nästa uppdrag eller låt nästa kund hitta dig.',
    url: 'https://prolink.se',
    siteName: 'Prolink',
    images: [
      {
        url: '/Copilot_20260430_140059.png',
        width: 1200,
        height: 630,
        alt: 'Prolink – där företag och frilansare möts',
      },
    ],
    locale: 'sv_SE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prolink – där företag och frilansare möts',
    description: 'Hitta rätt specialist för nästa uppdrag eller låt nästa kund hitta dig.',
    images: ['/Copilot_20260430_140059.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased min-h-screen flex flex-col`}>
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
