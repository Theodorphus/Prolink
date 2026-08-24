export type UserRole = 'customer' | 'provider'
export type JobStatus = 'open' | 'closed'
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'delivered' | 'completed'
export type OfferActor = 'customer' | 'provider'

export const OFFER_STATUSES: OfferStatus[]
export const WINNING_OFFER_STATUSES: OfferStatus[]

export function canSubmitOffer(input: {
  actorId: string | null | undefined
  actorRole: UserRole | string | null | undefined
  requestOwnerId: string | null | undefined
  requestStatus: JobStatus | string | null | undefined
}): boolean

export function requiredActorForTransition(
  currentStatus: OfferStatus | string,
  nextStatus: OfferStatus | string
): OfferActor | null

export function canTransitionOffer(input: {
  actorId: string | null | undefined
  customerId: string | null | undefined
  providerId: string | null | undefined
  currentStatus: OfferStatus | string
  nextStatus: OfferStatus | string
}): boolean

export function isOfferParticipant(
  actorId: string | null | undefined,
  customerId: string | null | undefined,
  providerId: string | null | undefined
): boolean

export function isAttachmentPathForOffer(path: unknown, offerId: string): boolean
export function hasMultipleWinningOffers(statuses: Array<OfferStatus | string>): boolean
