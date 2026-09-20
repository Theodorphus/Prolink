// Publika jobblistor får aldrig innehålla employer_email eller contact_info.
// Kolumnerna är läsbara för anon i databasen, så urvalet måste ske här.
//
// salary och employer_name hörde till den avvecklade anställningstavlan. De
// hämtades på varje jobbfråga men renderades aldrig, och är null på samtliga
// rader, så de är borttagna ur urvalet. Kolumnerna finns kvar i databasen tills
// en städmigrering beslutas.
export const PUBLIC_JOB_FIELDS =
  'id, customer_id, title, description, budget, status, created_at, category, location, work_type'
