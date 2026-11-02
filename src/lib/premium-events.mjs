// Vilka mejl en ändring av prenumerationen ska ge. Jämför raden som ligger i
// databasen med det Stripe nu säger, så att samma händelse inte mejlas två
// gånger även om Stripe skickar den flera gånger.
const LIVE = ['active', 'trialing']
const ENDED = ['canceled', 'unpaid', 'incomplete_expired']

export function premiumEvents(before, after) {
  const was = before?.status ?? 'none'
  const wasLive = LIVE.includes(was)
  const isLive = LIVE.includes(after.status)
  const events = []
  // past_due som blir active är en lyckad omdragning, inte en ny start.
  if (isLive && !wasLive && was !== 'past_due') events.push('started')
  if (isLive && after.cancelAtPeriodEnd && !(before?.cancel_at_period_end && wasLive)) events.push('cancel_scheduled')
  if (after.status === 'past_due' && was !== 'past_due') events.push('payment_failed')
  if (ENDED.includes(after.status) && (wasLive || was === 'past_due')) events.push('ended')
  return events
}
