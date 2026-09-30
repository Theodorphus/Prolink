import Link from 'next/link'
import { COMPANY, CONTACT_EMAIL } from '@/lib/site'

const links = {
  Plattform: [
    { href: '/jobs', label: 'Hitta uppdrag' },
    { href: '/services', label: 'Hitta tjänster' },
    { href: '/jobs/create', label: 'Publicera uppdrag' },
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
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-lg font-black tracking-[-0.03em] text-slate-900">
              Prolink
            </Link>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-xs font-medium">
              Marknadsplatsen där småföretag och frilansare hittar varandra.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                'Kostnadsfritt att publicera uppdrag',
                'Du äger dialogen med din motpart',
                'Omdömen först efter genomfört uppdrag',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-xs font-medium text-gray-600">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-4 inline-block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {CONTACT_EMAIL}
            </a>
          </div>

          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
                {group}
              </p>
              <ul className="space-y-3">
                {items.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-600 font-medium">
              © {new Date().getFullYear()} Prolink. Alla rättigheter förbehållna.
            </p>
            {/* Varje uppgift hålls ihop, så att raden bryts mellan dem på mobil
                och inte mitt i ett nummer eller en adress. */}
            <p className="mt-1.5 flex flex-wrap justify-center sm:justify-start gap-x-2 gap-y-0.5 text-xs text-gray-500">
              {[
                `Drivs av ${COMPANY.name}`,
                `Org.nr ${COMPANY.orgNumber}`,
                `Momsreg.nr ${COMPANY.vatNumber}`,
                COMPANY.address,
              ].map((item, index) => (
                <span key={item} className="whitespace-nowrap">
                  {index > 0 && <span className="mr-2 text-gray-300" aria-hidden>·</span>}
                  {item}
                </span>
              ))}
            </p>
          </div>
          <p className="text-xs text-gray-600 font-medium">
            Skapad av{' '}
            <a
              href={COMPANY.url}
              target="_blank"
              rel="noopener"
              className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-900"
            >
              {COMPANY.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
