import Link from 'next/link'

const links = {
  Plattform: [
    { href: '/jobs', label: 'Hitta uppdrag' },
    { href: '/services', label: 'Bläddra tjänster' },
    { href: '/jobs/create', label: 'Lägg ut uppdrag' },
    { href: '/services/create', label: 'Erbjud tjänster' },
  ],
  Konto: [
    { href: '/login', label: 'Logga in' },
    { href: '/register', label: 'Skapa konto' },
  ],
  Support: [
    { href: '/faq', label: 'Vanliga frågor' },
    { href: '/privacy', label: 'Integritetspolicy' },
    { href: '/terms', label: 'Användarvillkor' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
              Prolink
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-xs">
              Sveriges marknadsplats för freelancers och företag. Enkel, snabb, gratis.
            </p>
          </div>

          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
                {group}
              </p>
              <ul className="space-y-3">
                {items.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Prolink. Alla rättigheter förbehållna.
          </p>
          <p className="text-xs text-gray-400">
            Byggt i Sverige 🇸🇪
          </p>
        </div>
      </div>
    </footer>
  )
}
