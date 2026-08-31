import Link from 'next/link'
import { login } from '@/lib/actions/auth'
import AuthForm from '@/components/auth/AuthForm'

export const metadata = {
  title: 'Logga in',
  description: 'Logga in på Prolink och hantera dina uppdrag, offerter och meddelanden.',
}

export default async function LoginPage(
  props: {
    searchParams: Promise<{ redirect?: string }>
  }
) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="page-heading text-3xl">Välkommen tillbaka</h1>
          <p className="muted mt-2.5 text-sm font-medium">
            Har du inget konto?{' '}
            <Link href="/register" className="font-semibold text-blue-700 underline-offset-4 hover:underline">
              Skapa ett gratis
            </Link>
          </p>
        </div>
        <AuthForm action={login} submitLabel="Logga in" redirect={searchParams.redirect} />
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
