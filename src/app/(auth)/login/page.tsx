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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Logga in</h1>
          <p className="mt-2 text-gray-600">
            Har du inget konto?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Registrera dig
            </Link>
          </p>
        </div>
        <AuthForm action={login} submitLabel="Logga in" redirect={searchParams.redirect} />
      </div>
    </div>
  )
}
