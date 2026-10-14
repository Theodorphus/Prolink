import { revalidatePath, revalidateTag } from 'next/cache'

/** Tagg för de cachade uppdragsfrågorna på startsidan, se LatestJobs och siffrorna i page.tsx. */
export const PUBLIC_JOBS_TAG = 'public-jobs'

/**
 * Startsidan och kategorisidorna förrenderas och cachas i en till fem minuter.
 * När ett uppdrag publiceras, ändras, stängs eller arkiveras ska de visa det
 * direkt i stället för att vänta ut cachen.
 */
export function refreshPublicJobSurfaces() {
  revalidateTag(PUBLIC_JOBS_TAG, { expire: 0 })
  revalidatePath('/')
  revalidatePath('/hitta/[kategori]', 'page')
}
