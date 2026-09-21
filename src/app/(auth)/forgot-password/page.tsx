import RecoveryForm from '@/components/auth/RecoveryForm'
import { requestPasswordReset } from '@/lib/actions/auth'
export const metadata = { title: 'Återställ lösenord', robots: { index: false, follow: false } }
export default async function Page({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams
  return <div className="mx-auto max-w-md px-4 py-16"><h1 className="page-heading mb-6 text-3xl">Återställ lösenord</h1><RecoveryForm action={requestPasswordReset} password={false} redirect={redirect} /></div>
}
