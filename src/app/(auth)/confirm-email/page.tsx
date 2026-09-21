import RecoveryForm from '@/components/auth/RecoveryForm'
import { resendConfirmation } from '@/lib/actions/auth'
export const metadata = { title: 'Bekräfta e-post', robots: { index: false, follow: false } }
export default async function Page({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams
  return <div className="mx-auto max-w-md px-4 py-16"><h1 className="page-heading mb-6 text-3xl">Bekräfta e-post</h1><RecoveryForm action={resendConfirmation} password={false} redirect={redirect} /></div>
}
