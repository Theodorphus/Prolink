export function normalizeOrgNumber(value: unknown): string | null
export function formatOrgNumber(value: string): string
export function referenceEmailProblem(clientEmail: unknown, providerEmail: unknown): string | null
/** null = tomt, undefined = ogiltig adress. */
export function normalizeWebsite(value: unknown): string | null | undefined
export function websiteLabel(value: string): string
export interface CompletenessInput {
  avatar_url: string | null
  bio: string | null
  skills: string[] | null
  location: string | null
  work_mode: string | null
  website_url: string | null
  linkedin_url: string | null
  services: number
  portfolio: number
  companySubmitted: boolean
  referencesRequested: number
}
export function profileCompleteness(profile: CompletenessInput): { percent: number; missing: { key: string; label: string; anchor: string }[] }
export function responseTimeLabel(medianHours: number | null | undefined, samples: number): string | null
export const WORK_MODES: Record<'remote' | 'onsite' | 'hybrid', string>
