import { getLocale, getT } from '@/i18n/server'
import { formatDate } from '@/lib/utils'
import { premiumPrice } from '@/lib/premium'
import PremiumButton from './PremiumButton'

export interface PremiumStatus {
  active: boolean
  cancelAtPeriodEnd: boolean
  periodEnd: string | null
  hasCustomer: boolean
}

/**
 * Premium är ett tillval, inte ett krav. Rutan ligger högt upp på den egna
 * profilen så att den går att hitta, men är lågmäld: en ljus ruta och en
 * vanlig knapp, ingen banner, och inget syns för andra besökare.
 */
export default async function PremiumPanel({ status, justSubscribed }: { status: PremiumStatus; justSubscribed: boolean }) {
  const t = await getT()
  const locale = await getLocale()
  const price = status.active ? null : await premiumPrice()
  const priceText = price ? new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'sv-SE', { style: 'currency', currency: price.currency, maximumFractionDigits: 0 }).format(price.amount) : null
  const link = 'text-sm font-semibold text-blue-700 hover:underline'

  return (
    <section id="premium" className={`scroll-mt-24 rounded-panel border p-6 ${status.active ? 'border-line-soft bg-surface-card' : 'border-blue-100 bg-blue-50/50'}`}>
      <h2 className="font-bold text-slate-900">{t('Prolink Premium')}</h2>
      {status.active ? (
        <>
          <p className="muted mt-1.5 text-sm font-medium">
            {status.cancelAtPeriodEnd && status.periodEnd
              ? t('Du har Premium till och med {date}. Därefter går kontot tillbaka till gratis, och inget förnyas.', { date: formatDate(status.periodEnd, locale) })
              : status.periodEnd
                ? t('Du har Premium. Nästa förnyelse är {date}.', { date: formatDate(status.periodEnd, locale) })
                : t('Du har Premium.')}
          </p>
          <ul className="muted mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>{t('Fler av dina tjänster syns i listan')}</li>
            <li>{t('Högre placering i tjänstelistan')}</li>
            <li>{t('Mejl om nya uppdrag en dag före övriga')}</li>
          </ul>
          <div className="mt-4">
            <PremiumButton endpoint="/api/premium/portal" label={t('Hantera prenumeration')} className={link} />
          </div>
        </>
      ) : (
        <>
          {justSubscribed && (
            <p role="status" className="mt-2 text-sm font-semibold text-emerald-700">
              {t('Tack! Det kan dröja en minut innan Premium syns här.')}
            </p>
          )}
          <p className="muted mt-1.5 text-sm font-medium">
            {t('Du behöver inte Premium för att använda Prolink. Det är ett tillval för dig som vill synas lite mer.')}
          </p>
          <ul className="muted mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>{t('Fler av dina tjänster syns i listan')}</li>
            <li>{t('Högre placering i tjänstelistan')}</li>
            <li>{t('Mejl om nya uppdrag en dag före övriga')}</li>
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
            <PremiumButton endpoint="/api/premium/checkout" label={t('Uppgradera till Premium')} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800" />
            {priceText && <span className="muted text-xs">{t('{price} per månad, avsluta när du vill', { price: priceText })}</span>}
          </div>
          {status.hasCustomer && (
            <div className="mt-2">
              <PremiumButton endpoint="/api/premium/portal" label={t('Tidigare betalningar och kvitton')} className="text-xs font-semibold text-slate-500 hover:underline" />
            </div>
          )}
        </>
      )}
    </section>
  )
}
