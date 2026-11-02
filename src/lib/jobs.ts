// Publika jobblistor får aldrig innehålla employer_email eller contact_info.
// Kolumnerna är läsbara för anon i databasen, så urvalet måste ske här.
//
// salary och employer_name hörde till den avvecklade anställningstavlan. De
// hämtades på varje jobbfråga men renderades aldrig, och är null på samtliga
// rader, så de är borttagna ur urvalet. Kolumnerna finns kvar i databasen tills
// en städmigrering beslutas.
export const PUBLIC_JOB_FIELDS =
  'id, customer_id, title, description, budget, status, created_at, category, location, work_type, boosted_until'

/**
 * Lyfta uppdrag visas överst och märks "Utvalt". Jämförelsen med klockan ligger
 * här och inte i komponenterna, som inte ska anropa Date.now vid rendering.
 */
export function isBoosted(job: { boosted_until?: string | null }): boolean {
  return Boolean(job.boosted_until && Date.parse(job.boosted_until) > Date.now())
}

/**
 * Senast lyft först, därefter nyast först. Utgångna lyft nollställs av
 * cron-rutten, så boosted_at är bara satt för uppdrag som är lyfta just nu.
 */
export function boostedFirst<Q extends { order: (column: string, options: { ascending: boolean; nullsFirst?: boolean }) => Q }>(query: Q): Q {
  return query.order('boosted_at', { ascending: false, nullsFirst: false })
}
