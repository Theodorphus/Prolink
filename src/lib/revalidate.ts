import { revalidatePath, revalidateTag } from 'next/cache'

/** Tagg för de cachade uppdragsfrågorna på startsidan, se LatestJobs och siffrorna i page.tsx. */
export const PUBLIC_JOBS_TAG = 'public-jobs'

/** Tagg för de cachade tjänstefrågorna på startsidan: utvalda tjänster, antal per kategori och totalsiffran. */
export const PUBLIC_SERVICES_TAG = 'public-services'

/**
 * Startsidan och kategorisidorna förrenderas och cachas i en till fem minuter.
 * När ett uppdrag publiceras, ändras, stängs eller arkiveras ska de visa det
 * direkt i stället för att vänta ut cachen.
 */
export function refreshPublicJobSurfaces() {
  revalidateTag(PUBLIC_JOBS_TAG, { expire: 0 })
  // Sidorna ligger under [lang], så både svenska och engelska versionen byggs om.
  revalidatePath('/[lang]', 'page')
  revalidatePath('/[lang]/hitta/[kategori]', 'page')
}

/**
 * Samma sak för tjänster. Utan den här syntes en ny, ändrad eller borttagen
 * tjänst på startsidan först när minutcachen löpt ut.
 */
export function refreshPublicServiceSurfaces() {
  revalidateTag(PUBLIC_SERVICES_TAG, { expire: 0 })
  revalidatePath('/[lang]', 'page')
  revalidatePath('/[lang]/hitta/[kategori]', 'page')
}
