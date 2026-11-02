export type PremiumEvent = 'started' | 'cancel_scheduled' | 'payment_failed' | 'ended'
export function premiumEvents(
  before: { status: string; cancel_at_period_end: boolean } | null,
  after: { status: string; cancelAtPeriodEnd: boolean },
): PremiumEvent[]
