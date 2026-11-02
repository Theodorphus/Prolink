import type { PremiumEvent } from '@/lib/premium-events.mjs'
import type { TFunction } from '@/i18n/translate'
import type { Locale } from '@/i18n/config'
import { formatDate } from '@/lib/utils'

/**
 * Mejlen om prenumerationen. De skrivs på mottagarens språk redan här, eftersom
 * de innehåller datum, och köas i notiskön som alla andra mejl.
 */
export function premiumEmailContent(event: PremiumEvent, periodEnd: string | null, t: TFunction, locale: Locale) {
  const date = periodEnd ? formatDate(periodEnd, locale) : ''
  switch (event) {
    case 'started':
      return {
        subject: t('Välkommen till Prolink Premium'),
        body: date
          ? t('Din Premium är aktiv. Du får fler tjänster i listan, högre placering och mejl om nya uppdrag en dag före övriga. Nästa förnyelse är {date}. Du kan avsluta när som helst på din profil.', { date })
          : t('Din Premium är aktiv. Du får fler tjänster i listan, högre placering och mejl om nya uppdrag en dag före övriga. Du kan avsluta när som helst på din profil.'),
      }
    case 'cancel_scheduled':
      return {
        subject: t('Din Premium avslutas'),
        body: date
          ? t('Du har sagt upp Prolink Premium. Du behåller förmånerna till och med {date}, och därefter förnyas inget. Ångrar du dig kan du återuppta prenumerationen på din profil.', { date })
          : t('Du har sagt upp Prolink Premium. Du behåller förmånerna perioden ut, och därefter förnyas inget. Ångrar du dig kan du återuppta prenumerationen på din profil.'),
      }
    case 'payment_failed':
      return {
        subject: t('Betalningen för din Premium misslyckades'),
        body: t('Vi kunde inte dra betalningen för Prolink Premium. Uppdatera ditt kort under Hantera prenumeration på din profil så att Premium fortsätter. Stripe försöker dra kortet igen automatiskt.'),
      }
    case 'ended':
      return {
        subject: t('Din Premium har avslutats'),
        body: t('Din Prolink Premium har upphört och kontot är nu gratis. Din profil och dina tjänster finns kvar. Du kan starta Premium igen när du vill, på din profil.'),
      }
  }
}
