import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import NavbarWrapper from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import { Analytics } from "@vercel/analytics/react"
import { SITE_URL } from '@/lib/site'


const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-heading', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Prolink', template: '%s | Prolink' },
  description: 'Hitta frilansare, tjänster och uppdrag inom webb, design, marknadsföring, redovisning och IT.',
  alternates: { canonical: '/' },
  icons: {
    icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Prolink – där företag och frilansare möts',
    description: 'Hitta rätt specialist för nästa uppdrag eller låt nästa kund hitta dig.',
    url: SITE_URL,
    siteName: 'Prolink',
    images: [
      {
        url: '/og-image.jpg',
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
    images: ['/og-image.jpg'],
  },
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased min-h-screen flex flex-col`}>
        {/* Utan en hoppa-till-länk måste en tangentbordsanvändare tabba genom
            hela navigationen på varje sidladdning. Länken syns först när den
            får fokus. */}
        <a
          href="#innehall"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-slate-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
        >
          Hoppa till innehållet
        </a>
        <NavbarWrapper>
          <Navbar />
        </NavbarWrapper>
        <main id="innehall" className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
