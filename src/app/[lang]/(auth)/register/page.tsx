import Link from '@/components/i18n/Link'
import { register } from '@/lib/actions/auth'
import RegisterForm from '@/components/auth/RegisterForm'
import { getT } from '@/i18n/server'
import { splitLocale } from '@/i18n/config'

export async function generateMetadata() {
  const t = await getT()
  return {
    robots: { index: false, follow: false },
    title: t('Skapa konto'),
    description: t('Skapa ett gratis konto på Prolink och börja lägga ut uppdrag eller erbjud dina tjänster idag.'),
  }
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect = '/' } = await searchParams
  const t = await getT()
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="page-heading text-3xl">{t('Kom igång på Prolink')}</h1>
          <p className="muted mt-2.5 text-sm font-medium">
            {t('Har du redan ett konto?')}{' '}
            <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-blue-700 underline-offset-4 hover:underline">
              {t('Logga in')}
            </Link>
          </p>
        </div>
        {/* Köpare som skrivit ett uppdrag utloggade kommer hit när de publicerar. */}
        {splitLocale(redirect).path.startsWith('/jobs/create') && (
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm font-bold text-blue-900">{t('Ditt uppdrag är sparat')}</p>
            <p className="mt-1.5 text-xs leading-5 text-blue-800">
              {t('Skapa ett gratis konto så kommer du tillbaka till det och publicerar. Bekräftar du via mejl, öppna länken i samma webbläsare så finns texten kvar.')}
            </p>
          </div>
        )}
        <RegisterForm action={register} redirect={redirect} />
        <Link className="mt-4 block text-center text-sm underline" href={`/confirm-email?redirect=${encodeURIComponent(redirect)}`}>{t('Skicka nytt bekräftelsemejl')}</Link>
        <p className="muted mt-6 text-center text-xs">
          {t('Genom att skapa ett konto godkänner du våra')}{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-slate-700">{t('användarvillkor')}</Link>
          {' '}{t('och')}{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-700">{t('integritetspolicy')}</Link>.
        </p>
      </div>
    </div>
  )
}
