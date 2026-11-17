import Image from 'next/image'
import Link from '@/components/i18n/Link'
import NavAuth from './NavAuth'
import LanguageSwitcher from './LanguageSwitcher'
import { getT } from '@/i18n/server'

// Navigeringen läser inga cookies på servern. Den ligger i rotlayouten, så
// en enda cookieläsning här gjorde varje sida dynamisk och omöjlig att
// cacha. Inloggningsläget hämtas i stället i webbläsaren av NavAuth.
export default async function Navbar() {
  const t = await getT()
  const NAV_LINKS = [
    { href: '/jobs', label: t('Hitta uppdrag') },
    { href: '/services', label: t('Hitta tjänster') },
    { href: '/jobs/create', label: t('Publicera uppdrag') },
  ]
  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 nav-header transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-10">
            <Link href="/" className="shrink-0">
              {/* Över den mörka hjälten på startsidan syns bara den ljusa varianten.
                  Båda är lata med hög prioritet i stället för priority/preload:
                  en dold lat bild hämtas aldrig, så bara den som syns laddas,
                  och det blir rätt logga som hämtas först på varje sida. */}
              <Image src="/brand/prolink-logo.png" alt="Prolink" width={593} height={160} fetchPriority="high" className="nav-logo-dark block h-7 w-auto" />
              <Image src="/brand/prolink-logo-light.png" alt="Prolink" width={593} height={160} fetchPriority="high" className="nav-logo-light block h-7 w-auto" />
            </Link>
            {/* Från lg, inte md: vid 768 px fick länkarna och kontoknapparna
                inte plats och bröts på två rader. Surfplattor får mobilmenyn. */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-150 relative group"
                >
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-200" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <LanguageSwitcher className="hidden lg:inline-block text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5" />
            <NavAuth links={NAV_LINKS} />
          </div>
        </div>
      </div>
    </header>
  )
}
