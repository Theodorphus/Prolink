export const PAGE_SIZE = 24
export function pageNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 100000 ? parsed : 1
}

/**
 * PostgREST svarar med fel PGRST103 när sidan ligger bortom listans slut.
 * Profilsidan delar ett sidnummer mellan flera listor, så en kort lista når
 * sitt slut medan en längre fortsätter. Felet blir här en tom sida, och
 * antalet läses ur felets detaljer så att räknare och sidnavigering stämmer.
 */
export function emptyBeyondLastPage<R extends { data: unknown; count: number | null; error: { code?: string; details?: string | null } | null }>(result: R): R {
  if (result.error?.code !== 'PGRST103') return result
  const total = Number(/only (\d+) rows?/.exec(result.error.details ?? '')?.[1] ?? 0)
  return { ...result, data: [], count: total, error: null }
}
