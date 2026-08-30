// Publika jobblistor får aldrig innehålla employer_email eller contact_info.
// Kolumnerna är läsbara för anon i databasen, så urvalet måste ske här.
export const PUBLIC_JOB_FIELDS =
  'id, customer_id, title, description, budget, status, created_at, category, salary, location, work_type, employer_name, customer:users(name)'
