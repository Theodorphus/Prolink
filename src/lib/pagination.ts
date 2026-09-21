export const PAGE_SIZE = 24
export function pageNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 100000 ? parsed : 1
}
