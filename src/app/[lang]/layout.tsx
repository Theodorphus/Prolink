import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import NavbarWrapper from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import { Analytics } from "@vercel/analytics/react"
import { SITE_URL } from '@/lib/site'
import { DEFAULT_OG_IMAGE } from '@/lib/seo'
import { LOCALES, htmlLang, ogLocale } from '@/i18n/config'
import { getLocale } from '@/i18n/server'
import { createT } from '@/i18n/translate'
import { clientMessagesFor, messagesFor } from '@/i18n/messages'
import { LocaleProvider } from '@/i18n/client'


const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-heading', display: 'swap' })

export function generateStaticParams() {
  return LOCALES.map(lang => ({ lang }))
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = createT(locale, messagesFor(locale))
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: 'Prolink', template: '%s | Prolink' },
    description: t('Hitta frilansare, tjänster och uppdrag inom webb, design, marknadsföring, redovisning och IT.'),
    icons: {
      icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    // Bara standardvärden för sidor utan egen metadata (inloggning, 404).
    // og:url sätts inte här: den ärvdes av varje sida som saknade egen
    // openGraph, så delade länkar till t.ex. /services pekade på startsidan.
    // Indexerbara sidor använder pageMetadata i src/lib/seo.ts.
    openGraph: {
      title: t('Prolink – där företag och frilansare möts'),
      description: t('Hitta rätt specialist för nästa uppdrag eller låt nästa kund hitta dig.'),
      siteName: 'Prolink',
      images: [{ ...DEFAULT_OG_IMAGE, alt: t(DEFAULT_OG_IMAGE.alt) }],
      locale: ogLocale(locale),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const t = createT(locale, messagesFor(locale))
  return (
    <html lang={htmlLang(locale)}>
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <LocaleProvider locale={locale} messages={clientMessagesFor(locale)}>
          {/* Utan en hoppa-till-länk måste en tangentbordsanvändare tabba genom
              hela navigationen på varje sidladdning. Länken syns först när den
              får fokus. */}
          <a
            href="#innehall"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-slate-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {t('Hoppa till innehållet')}
          </a>
          <NavbarWrapper>
            <Navbar />
          </NavbarWrapper>
          <main id="innehall" className="flex-1">{children}</main>
          <Footer />
          <Analytics />
        </LocaleProvider>
      </body>
    </html>
  )
}
