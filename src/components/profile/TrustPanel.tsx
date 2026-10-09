'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { formatOrgNumber } from '@/lib/trust.mjs'

export interface CompanyVerification {
  org_number: string
  company_name: string
  f_skatt: boolean
  status: 'pending' | 'verified' | 'rejected'
  submitted_at: string
  review_note: string | null
}

export interface ReferenceRequest {
  id: string
  client_email: string
  created_at: string
  submitted_at: string | null
  expired: boolean
}

const fieldClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

const STATUS = {
  pending: { label: 'Granskas', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  verified: { label: 'Verifierat', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  rejected: { label: 'Kunde inte verifieras', className: 'bg-red-50 text-red-700 ring-red-200' },
} as const

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error ?? 'Något gick fel. Försök igen.')
}

// Det en ny frilansare kan göra för att köpare ska våga höra av sig, innan
// det finns några affärer på Prolink att visa upp.
export default function TrustPanel({ company, references }: { company: CompanyVerification | null; references: ReferenceRequest[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState(!company)
  const [companyError, setCompanyError] = useState('')
  const [companyLoading, setCompanyLoading] = useState(false)
  const [referenceError, setReferenceError] = useState('')
  const [referenceSent, setReferenceSent] = useState('')
  const [referenceLoading, setReferenceLoading] = useState(false)

  async function submitCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setCompanyLoading(true)
    setCompanyError('')
    try {
      await post('/api/company-verification', {
        org_number: form.get('org_number'),
        company_name: form.get('company_name'),
        f_skatt: form.get('f_skatt') === 'on',
      })
      setEditing(false)
      router.refresh()
    } catch (error) {
      setCompanyError(error instanceof Error ? error.message : 'Uppgifterna kunde inte sparas.')
    } finally {
      setCompanyLoading(false)
    }
  }

  async function submitReference(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const email = String(new FormData(formElement).get('email') ?? '')
    setReferenceLoading(true)
    setReferenceError('')
    setReferenceSent('')
    try {
      await post('/api/references', { email })
      formElement.reset()
      setReferenceSent(`Förfrågan skickades till ${email}.`)
      router.refresh()
    } catch (error) {
      setReferenceError(error instanceof Error ? error.message : 'Förfrågan kunde inte skickas.')
    } finally {
      setReferenceLoading(false)
    }
  }

  const answered = references.filter(reference => reference.submitted_at).length

  return (
    <section className="rounded-panel border border-line-soft bg-surface-card p-6">
      <h2 className="font-bold text-slate-900">Bygg förtroende</h2>
      <p className="muted mt-1.5 text-sm font-medium">
        Köpare väljer hellre någon de kan kontrollera. Verifiera ditt företag och be tidigare kunder om referenser, så syns det på din profil.
      </p>

      <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Verifierat företag</h3>
          {company && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS[company.status].className}`}>{STATUS[company.status].label}</span>}
        </div>

        {company && !editing ? (
          <div className="text-sm text-slate-600">
            <p>{company.company_name} · {formatOrgNumber(company.org_number)}{company.f_skatt ? ' · F-skatt' : ''}</p>
            {company.status === 'pending' && <p className="mt-1 text-xs">Vi kontrollerar uppgifterna mot Bolagsverket och Skatteverket. Märket visas på din profil när det är klart.</p>}
            {company.status === 'rejected' && company.review_note && <p className="mt-1 text-xs text-red-700">{company.review_note}</p>}
            <button type="button" onClick={() => setEditing(true)} className="mt-2 text-xs font-semibold text-blue-700 hover:underline">Ändra uppgifter</button>
          </div>
        ) : (
          <form onSubmit={submitCompany} className="space-y-3">
            {companyError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{companyError}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="trust-org" className="block text-sm font-medium text-gray-700">Organisationsnummer</label>
                <input id="trust-org" name="org_number" required inputMode="numeric" defaultValue={company ? formatOrgNumber(company.org_number) : ''} placeholder="556677-8899" className={fieldClass} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="trust-company" className="block text-sm font-medium text-gray-700">Företagsnamn</label>
                <input id="trust-company" name="company_name" required maxLength={120} autoComplete="organization" defaultValue={company?.company_name ?? ''} className={fieldClass} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="f_skatt" defaultChecked={company?.f_skatt ?? false} /> Företaget har F-skatt
            </label>
            <p className="text-xs text-slate-500">
              Organisationsnumret visas inte för andra. Har du enskild firma är det ditt personnummer. Profilen visar bara företagsnamnet och märket.
              Ändrar du uppgifterna granskas de på nytt.
            </p>
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={companyLoading}>Skicka för verifiering</Button>
              {company && <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>Avbryt</Button>}
            </div>
          </form>
        )}
      </div>

      <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Referenser från tidigare kunder</h3>
          {references.length > 0 && <span className="text-xs text-slate-500">{answered} av {references.length} har svarat</span>}
        </div>
        <p className="text-sm text-slate-600">
          Ange e-postadressen till en kund du har jobbat åt. Kunden får ett mejl och kan lämna ett omdöme utan konto. Omdömet visas på din profil, märkt som referens från extern kund.
        </p>
        <form onSubmit={submitReference} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="trust-reference" className="sr-only">Kundens e-post</label>
          <input id="trust-reference" name="email" type="email" required placeholder="kund@foretag.se" className={fieldClass} />
          <Button type="submit" size="sm" loading={referenceLoading} className="shrink-0">Be om referens</Button>
        </form>
        {referenceError && <p role="alert" className="text-sm text-red-700">{referenceError}</p>}
        {referenceSent && <p role="status" className="text-sm text-emerald-700">{referenceSent}</p>}

        {references.length > 0 && (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 text-sm">
            {references.map(reference => {
              const { expired } = reference
              return (
                <li key={reference.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <span className="min-w-0 truncate text-slate-700">{reference.client_email}</span>
                  <span className={`text-xs ${reference.submitted_at ? 'font-semibold text-emerald-700' : expired ? 'text-slate-400' : 'text-slate-500'}`}>
                    {reference.submitted_at ? `Svarade ${formatDate(reference.submitted_at)}` : expired ? 'Länken gick ut' : `Skickad ${formatDate(reference.created_at)}`}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
