import Link from 'next/link'
import { login } from '@/lib/actions/auth'
import AuthForm from '@/components/auth/AuthForm'

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Logga in',
  description: 'Logga in på Prolink och hantera dina uppdrag, offerter och meddelanden.',
}

export default async function LoginPage(
  props: {
    searchParams: Promise<{ redirect?: string; error?: string }>
  }
) {
  const searchParams = await props.searchParams
  const redirect = searchParams.redirect ?? ''

  // Meddelandet speglar vad användaren var på väg att göra.
  const targeted = redirect.startsWith('/jobs/create?') && (redirect.includes('service=') || redirect.includes('provider='))
  const intent = targeted
    ? { title: 'Logga in för att skicka din förfrågan', body: 'Vi behåller vald tjänst och mottagare. Förfrågan blir privat mellan dig och leverantören.' }
    : redirect.startsWith('/jobs/create')
    ? {
        title: 'Kontot behövs för att publicera uppdraget',
        body: 'Vi kopplar uppdraget till dig så att du kan ta emot offerter och svara frilansare. Det är kostnadsfritt att publicera och du binder dig inte till något.',
      }
    : redirect.includes('/offer')
      ? {
          title: 'Logga in för att lämna offert',
          body: 'Din offert kopplas till din profil så att kunden ser vem du är och kan svara dig direkt.',
        }
      : redirect.startsWith('/profile') || redirect.startsWith('/services')
        ? {
            title: 'Logga in för att ta kontakt',
            body: 'Du behöver ett konto för att kunna skicka en förfrågan och föra dialogen i Prolink.',
          }
        : null

  const heading = intent ? 'Logga in för att fortsätta' : 'Välkommen tillbaka'

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="page-heading text-3xl">{heading}</h1>
          <p className="muted mt-2.5 text-sm font-medium">
            Har du inget konto?{' '}
            <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-blue-700 underline-offset-4 hover:underline">
              Skapa ett gratis
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
        {searchParams.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">Inloggningslänken kunde inte användas. Försök igen eller begär ett nytt mejl.</p>}
        <AuthForm next={redirect} action={login} submitLabel="Logga in" redirect={searchParams.redirect} />
        <Link href="/forgot-password" className="mt-4 block text-center text-sm text-blue-700 underline">Glömt lösenord?</Link>
        <Link href={`/confirm-email?redirect=${encodeURIComponent(redirect)}`} className="mt-3 block text-center text-sm text-blue-700 underline">Skicka nytt bekräftelsemejl</Link>
        <p className="muted mt-6 text-center text-xs">
          Genom att logga in godkänner du våra{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-slate-700">användarvillkor</Link>
          {' '}och{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-700">integritetspolicy</Link>.
        </p>
      </div>
    </div>
  )
}
