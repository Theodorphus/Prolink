import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-bold text-blue-600">Prolink</p>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Prolink. Alla rättigheter förbehållna.</p>
          <nav className="flex gap-4 text-xs text-gray-500">
            <Link href="/services" className="hover:text-gray-900">Tjänster</Link>
            <Link href="/jobs" className="hover:text-gray-900">Uppdrag</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
