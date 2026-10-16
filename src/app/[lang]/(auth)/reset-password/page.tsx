import RecoveryForm from '@/components/auth/RecoveryForm'
import { resetPassword } from '@/lib/actions/auth'
import { getT } from '@/i18n/server'
export async function generateMetadata() {
  return { title: (await getT())('Välj nytt lösenord'), robots: { index: false, follow: false } }
}
export default async function Page({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams
  const t = await getT()
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="page-heading mb-3 text-3xl">{t('Välj nytt lösenord')}</h1>
      <p className="muted mb-6 text-sm">{t('Lösenordet ska vara minst 8 tecken. Blanda gärna stora och små bokstäver med siffror.')}</p>
      <RecoveryForm action={resetPassword} password={true} redirect={redirect} />
    </div>
  )
}
