import Link from 'next/link'

const links = {
  Plattform: [
    { href: '/jobs', label: 'Hitta jobb' },
    { href: '/jobs/create', label: 'Lägg upp jobb' },
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
            <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-xs font-medium">
              Göteborgs enklaste jobbsajt. Gratis för alla.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[
                { label: 'Instagram', href: 'https://instagram.com', icon: (
                  <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.6 3.6 0 00-.88-1.35 3.6 3.6 0 00-1.35-.88c-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.59-.07-4.74-.07zm0 2.76a5.3 5.3 0 110 10.6 5.3 5.3 0 010-10.6zm0 8.74a3.44 3.44 0 100-6.88 3.44 3.44 0 000 6.88zm6.74-8.94a1.24 1.24 0 11-2.48 0 1.24 1.24 0 012.48 0z" />
                )},
                { label: 'Facebook', href: 'https://facebook.com', icon: (
                  <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" />
                )},
              ].map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-gray-900 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">{icon}</svg>
                </a>
              ))}
            </div>
            <a href="mailto:hej@prolink.se" className="mt-4 inline-block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              hej@prolink.se
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

        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600 font-medium">
            © {new Date().getFullYear()} Prolink. Alla rättigheter förbehållna.
          </p>
          <p className="text-xs text-gray-600 font-medium">
            Byggt med ❤️ i Sverige
          </p>
        </div>
      </div>
    </footer>
  )
}
