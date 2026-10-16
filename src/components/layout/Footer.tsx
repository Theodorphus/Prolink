import Link from '@/components/i18n/Link'
import { COMPANY, CONTACT_EMAIL } from '@/lib/site'
import { getT } from '@/i18n/server'
import LanguageSwitcher from './LanguageSwitcher'

export default async function Footer() {
  const t = await getT()
  const links = {
    [t('Plattform')]: [
      { href: '/jobs', label: t('Hitta uppdrag') },
      { href: '/services', label: t('Hitta tjänster') },
      { href: '/jobs/create', label: t('Publicera uppdrag') },
    ],
    [t('Konto')]: [
      { href: '/login', label: t('Logga in') },
      { href: '/register', label: t('Skapa konto') },
    ],
    [t('Support')]: [
      { href: '/faq', label: t('Vanliga frågor') },
      { href: '/privacy', label: t('Integritetspolicy') },
      { href: '/terms', label: t('Användarvillkor') },
    ],
  }
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-lg font-black tracking-[-0.03em] text-slate-900">
              Prolink
            </Link>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-xs font-medium">
              {t('Marknadsplatsen där småföretag och frilansare hittar varandra.')}
            </p>
            <ul className="mt-5 space-y-2">
              {[
                t('Kostnadsfritt att publicera uppdrag'),
                t('Du äger dialogen med din motpart'),
                t('Omdömen först efter genomfört uppdrag'),
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
                    {/* Kontolänkarna förhämtas inte. För en inloggad besökare
                        svarar proxyn på /login och /register med en
                        omdirigering till startsidan, och förhämtningen
                        upprepades då i en loop som aldrig lät nätet vila. */}
                    <Link href={href} prefetch={href === '/login' || href === '/register' ? false : undefined} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
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
              © {new Date().getFullYear()} Prolink. {t('Alla rättigheter förbehållna.')}
            </p>
            {/* För en enskild firma är organisationsnumret innehavarens
                personnummer. E-handelslagen kräver att uppgifterna är lätta att
                nå, inte att de står på varje sida, så sidfoten länkar till
                villkoren där org.nr, momsreg.nr och adress finns samlade. */}
            <p className="mt-1.5 text-xs text-gray-500">
              {t('Drivs av')} {COMPANY.name}
              <span className="mx-2 text-gray-300" aria-hidden>·</span>
              <Link href="/terms#foretagsuppgifter" className="underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-900 hover:decoration-gray-900">
                {t('Företagsuppgifter')}
              </Link>
            </p>
          </div>
          <p className="flex items-center gap-4 text-xs text-gray-600 font-medium">
            <LanguageSwitcher className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-900" />
            <span>
            {t('Skapad av')}{' '}
            <a
              href={COMPANY.url}
              target="_blank"
              rel="noopener"
              className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-900"
            >
              {COMPANY.name}
            </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}
