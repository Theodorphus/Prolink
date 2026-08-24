import 'server-only'

import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client for narrowly scoped administrative operations,
 * such as looking up an authenticated user's email address for notifications.
 * It must never be imported from a Client Component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin client is not configured')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}
