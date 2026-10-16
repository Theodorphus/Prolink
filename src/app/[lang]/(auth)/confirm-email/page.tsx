import Link from '@/components/i18n/Link'
import RecoveryForm from '@/components/auth/RecoveryForm'
import { resendConfirmation } from '@/lib/actions/auth'
import { getT } from '@/i18n/server'
export async function generateMetadata() {
  return { title: (await getT())('Bekräfta e-post'), robots: { index: false, follow: false } }
}
export default async function Page({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams
  const t = await getT()
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="page-heading mb-3 text-3xl">{t('Bekräfta e-post')}</h1>
      <p className="muted mb-6 text-sm">{t('Fick du inget bekräftelsemejl när du skapade kontot? Kontrollera skräpposten, eller ange adressen nedan så skickar vi ett nytt.')}</p>
      <RecoveryForm action={resendConfirmation} password={false} redirect={redirect} />
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-blue-700 hover:underline">{t('Tillbaka till inloggningen')}</Link></p>
    </div>
  )
}
