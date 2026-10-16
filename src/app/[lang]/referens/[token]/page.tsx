import Link from '@/components/i18n/Link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { referenceExpired, referenceTokenHash } from '@/lib/references'
import ReferenceForm from '@/components/references/ReferenceForm'
import { getT } from '@/i18n/server'

export async function generateMetadata() {
  return { title: (await getT())('Lämna ett omdöme'), robots: { index: false, follow: false } }
}

// Mottagaren har inget konto, så raden läses med service-rollen via hashen av
// länkens token. Sidan visar bara frilansarens namn, aldrig andra uppgifter.
export default async function ReferencePage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const t = await getT()
  const tokenHash = referenceTokenHash(token)
  if (!tokenHash) notFound()

  const admin = createAdminClient()
  const { data: reference, error } = await admin.from('external_references')
    .select('provider_id, expires_at, submitted_at, provider:users(name)')
    .eq('token_hash', tokenHash)
    .maybeSingle()
  if (error) throw new Error('Förfrågan kunde inte hämtas.')
  if (!reference) notFound()

  const provider = Array.isArray(reference.provider) ? reference.provider[0] : reference.provider
  const name = provider?.name || t('Frilansaren')
  const closed = reference.submitted_at
    ? t('Tack! Ditt omdöme är redan lämnat.')
    : referenceExpired(reference.expires_at)
      ? t('Länken har gått ut. Be {name} skicka en ny förfrågan om du vill lämna ett omdöme.', { name })
      : null

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <p className="page-eyebrow">{t('Referens')}</p>
      <h1 className="page-heading mt-2 text-3xl">{t('Hur var det att anlita {name}?', { name })}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {t('{name} har angett dig som tidigare kund och ber om ett kort omdöme till sin profil på Prolink. Omdömet visas med ditt namn och märks som en referens från en extern kund. Din e-postadress visas aldrig.', { name })}
      </p>
      <div className="mt-8">
        {closed ? (
          <div className="surface p-6 text-sm text-slate-700">
            <p>{closed}</p>
            <Link href={`/profile/${reference.provider_id}`} className="mt-3 inline-block font-semibold text-blue-700 hover:underline">{t('Se profilen för {name}', { name })}</Link>
          </div>
        ) : (
          <ReferenceForm token={token} providerName={name} providerId={reference.provider_id} />
        )}
      </div>
    </div>
  )
}
