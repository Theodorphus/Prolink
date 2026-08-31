import Link from 'next/link'
import { register } from '@/lib/actions/auth'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Skapa konto',
  description: 'Skapa ett gratis konto på Prolink och börja lägga ut uppdrag eller erbjud dina tjänster idag.',
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="page-heading text-3xl">Kom igång på Prolink</h1>
          <p className="muted mt-2.5 text-sm font-medium">
            Har du redan ett konto?{' '}
            <Link href="/login" className="font-semibold text-blue-700 underline-offset-4 hover:underline">
              Logga in
            </Link>
          </p>
        </div>
        <RegisterForm action={register} />
        <p className="muted mt-6 text-center text-xs">
          Genom att skapa ett konto godkänner du våra{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-slate-700">användarvillkor</Link>
          {' '}och{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-700">integritetspolicy</Link>.
        </p>
      </div>
    </div>
  )
}
