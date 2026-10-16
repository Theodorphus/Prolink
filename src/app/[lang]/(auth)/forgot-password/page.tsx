import Link from '@/components/i18n/Link'
import RecoveryForm from '@/components/auth/RecoveryForm'
import { requestPasswordReset } from '@/lib/actions/auth'
import { getT } from '@/i18n/server'
export async function generateMetadata() {
  return { title: (await getT())('Återställ lösenord'), robots: { index: false, follow: false } }
}
export default async function Page({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams
  const t = await getT()
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="page-heading mb-3 text-3xl">{t('Återställ lösenord')}</h1>
      <p className="muted mb-6 text-sm">{t('Ange e-postadressen du registrerade dig med, så skickar vi en länk där du kan välja ett nytt lösenord. Öppna länken i samma webbläsare.')}</p>
      <RecoveryForm action={requestPasswordReset} password={false} redirect={redirect} />
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-blue-700 hover:underline">{t('Tillbaka till inloggningen')}</Link></p>
    </div>
  )
}
