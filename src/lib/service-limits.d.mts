export const FEATURED_SERVICE_COUNT: number
export const MAX_SERVICES_PER_PROVIDER: number
export function onePerProvider<T extends { provider_id: string }>(services: T[], limit: number): T[]
export function capPerProvider<T extends { id: string; provider_id: string }>(services: T[], max: number): {
  visible: T[]
  hidden: Map<string, number>
  lastVisible: Map<string, string>
}
