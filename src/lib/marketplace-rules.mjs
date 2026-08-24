export const OFFER_STATUSES = ['pending', 'accepted', 'rejected', 'delivered', 'completed']
export const WINNING_OFFER_STATUSES = ['accepted', 'delivered', 'completed']

const TRANSITIONS = {
  pending: { accepted: 'customer', rejected: 'customer' },
  accepted: { delivered: 'provider' },
  delivered: { completed: 'customer' },
}

export function canSubmitOffer({ actorId, actorRole, requestOwnerId, requestStatus }) {
  return Boolean(
    actorId
    && actorRole === 'provider'
    && requestOwnerId
    && actorId !== requestOwnerId
    && requestStatus === 'open'
  )
}

export function requiredActorForTransition(currentStatus, nextStatus) {
  return TRANSITIONS[currentStatus]?.[nextStatus] ?? null
}

export function canTransitionOffer({
  actorId,
  customerId,
  providerId,
  currentStatus,
  nextStatus,
}) {
  if (currentStatus === nextStatus) {
    return actorId === customerId || actorId === providerId
  }

  const requiredActor = requiredActorForTransition(currentStatus, nextStatus)
  if (requiredActor === 'customer') return actorId === customerId
  if (requiredActor === 'provider') return actorId === providerId
  return false
}

export function isOfferParticipant(actorId, customerId, providerId) {
  return Boolean(actorId && (actorId === customerId || actorId === providerId))
}

export function isAttachmentPathForOffer(path, offerId) {
  return typeof path === 'string'
    && path.startsWith(`${offerId}/`)
    && !path.includes('..')
    && !path.includes('\\')
}

export function hasMultipleWinningOffers(statuses) {
  return statuses.filter(status => WINNING_OFFER_STATUSES.includes(status)).length > 1
}
