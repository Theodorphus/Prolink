import Link from 'next/link'
import NavAuth from './NavAuth'

const NAV_LINKS = [
  { href: '/jobs', label: 'Hitta uppdrag' },
  { href: '/services', label: 'Hitta tjänster' },
  { href: '/jobs/create', label: 'Publicera uppdrag' },
]

// Navigeringen läser inga cookies på servern. Den ligger i rotlayouten, så
// en enda cookieläsning här gjorde varje sida dynamisk och omöjlig att
// cacha. Inloggningsläget hämtas i stället i webbläsaren av NavAuth.
export default function Navbar() {
  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 nav-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-10">
            <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
              Prolink
            </Link>
            <nav className="hidden md:flex items-center gap-8">
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
            <NavAuth links={NAV_LINKS} />
          </div>
        </div>
      </div>
    </header>
  )
}
