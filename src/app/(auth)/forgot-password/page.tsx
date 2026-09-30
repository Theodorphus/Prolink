import Link from 'next/link'
import RecoveryForm from '@/components/auth/RecoveryForm'
import { requestPasswordReset } from '@/lib/actions/auth'
export const metadata = { title: 'Återställ lösenord', robots: { index: false, follow: false } }
export default async function Page({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="page-heading mb-3 text-3xl">Återställ lösenord</h1>
      <p className="muted mb-6 text-sm">Ange e-postadressen du registrerade dig med, så skickar vi en länk där du kan välja ett nytt lösenord. Öppna länken i samma webbläsare.</p>
      <RecoveryForm action={requestPasswordReset} password={false} redirect={redirect} />
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-blue-700 hover:underline">Tillbaka till inloggningen</Link></p>
    </div>
  )
}
