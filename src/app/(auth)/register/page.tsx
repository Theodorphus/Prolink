import Link from 'next/link'
import { register } from '@/lib/actions/auth'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Skapa konto',
  description: 'Skapa ett gratis konto på Prolink och börja lägga ut uppdrag eller erbjud dina tjänster idag.',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Skapa konto</h1>
          <p className="mt-2 text-gray-600">
            Har du redan ett konto?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Logga in
            </Link>
          </p>
        </div>
        <RegisterForm action={register} />
      </div>
    </div>
  )
}
