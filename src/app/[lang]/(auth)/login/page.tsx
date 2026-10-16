import Link from '@/components/i18n/Link'
import { login } from '@/lib/actions/auth'
import AuthForm from '@/components/auth/AuthForm'
import { getT } from '@/i18n/server'
import { splitLocale } from '@/i18n/config'

export async function generateMetadata() {
  const t = await getT()
  return {
    robots: { index: false, follow: false },
    title: t('Logga in'),
    description: t('Logga in på Prolink och hantera dina uppdrag, offerter och meddelanden.'),
  }
}

export default async function LoginPage(
  props: {
    searchParams: Promise<{ redirect?: string; error?: string }>
  }
) {
  const searchParams = await props.searchParams
  const t = await getT()
  const redirect = searchParams.redirect ?? ''
  // Målet kan ha språkprefix (/en/jobs/create); jämförelserna gäller sökvägen.
  const target = splitLocale(redirect).path

  // Meddelandet speglar vad användaren var på väg att göra.
  const targeted = target.startsWith('/jobs/create?') && (target.includes('service=') || target.includes('provider='))
  const intent = targeted
    ? { title: t('Logga in för att skicka din förfrågan'), body: t('Det du skrivit är sparat. Efter inloggningen kommer du tillbaka till förfrågan och skickar den. Den blir privat mellan dig och leverantören.') }
    : target.startsWith('/jobs/create')
    ? {
        title: t('Kontot behövs för att publicera uppdraget'),
        body: t('Det du skrivit är sparat. Vi kopplar uppdraget till dig så att du kan ta emot offerter och svara frilansare. Det är kostnadsfritt att publicera och du binder dig inte till något.'),
      }
    : target.includes('/offer')
      ? {
          title: t('Logga in för att lämna offert'),
          body: t('Din offert kopplas till din profil så att kunden ser vem du är och kan svara dig direkt.'),
        }
      : target.startsWith('/profile') || target.startsWith('/services')
        ? {
            title: t('Logga in för att ta kontakt'),
            body: t('Du behöver ett konto för att kunna skicka en förfrågan och föra dialogen i Prolink.'),
          }
        : null

  const heading = intent ? t('Logga in för att fortsätta') : t('Välkommen tillbaka')

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="page-heading text-3xl">{heading}</h1>
          <p className="muted mt-2.5 text-sm font-medium">
            {t('Har du inget konto?')}{' '}
            <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-blue-700 underline-offset-4 hover:underline">
              {t('Skapa ett gratis')}
            </Link>
          </p>
        </div>

        {/* Utloggade som klickar "Publicera uppdrag" hamnar här utan förklaring.
            Kontexten säger varför kontot behövs och att det är kostnadsfritt. */}
        {intent && (
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm font-bold text-blue-900">{intent.title}</p>
            <p className="mt-1.5 text-xs leading-5 text-blue-800">{intent.body}</p>
          </div>
        )}
        {searchParams.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{t('Inloggningslänken kunde inte användas. Försök igen eller begär ett nytt mejl.')}</p>}
        <AuthForm next={redirect} action={login} submitLabel={t('Logga in')} redirect={searchParams.redirect} />
        <Link href="/forgot-password" className="mt-4 block text-center text-sm text-blue-700 underline">{t('Glömt lösenord?')}</Link>
        <Link href={`/confirm-email?redirect=${encodeURIComponent(redirect)}`} className="mt-3 block text-center text-sm text-blue-700 underline">{t('Skicka nytt bekräftelsemejl')}</Link>
        <p className="muted mt-6 text-center text-xs">
          {t('Genom att logga in godkänner du våra')}{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-slate-700">{t('användarvillkor')}</Link>
          {' '}{t('och')}{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-700">{t('integritetspolicy')}</Link>.
        </p>
      </div>
    </div>
  )
}
