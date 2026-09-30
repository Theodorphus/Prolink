import Link from 'next/link'
import RecoveryForm from '@/components/auth/RecoveryForm'
import { resendConfirmation } from '@/lib/actions/auth'
export const metadata = { title: 'Bekräfta e-post', robots: { index: false, follow: false } }
export default async function Page({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="page-heading mb-3 text-3xl">Bekräfta e-post</h1>
      <p className="muted mb-6 text-sm">Fick du inget bekräftelsemejl när du skapade kontot? Kontrollera skräpposten, eller ange adressen nedan så skickar vi ett nytt.</p>
      <RecoveryForm action={resendConfirmation} password={false} redirect={redirect} />
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-blue-700 hover:underline">Tillbaka till inloggningen</Link></p>
    </div>
  )
}
