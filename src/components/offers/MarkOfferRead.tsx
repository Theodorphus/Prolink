'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notifyUnreadChanged } from '@/components/layout/useUnreadCount'

// Markerar offerten som sedd när kunden öppnar den. Görs i webbläsaren och inte
// vid serverrenderingen, så att en förhämtning inte räknas som att den lästs.
export default function MarkOfferRead({ offerId }: { offerId: string }) {
  const [supabase] = useState(createClient)
  useEffect(() => {
    supabase.rpc('mark_offer_read', { p_offer_id: offerId }).then(({ error }) => {
      if (!error) notifyUnreadChanged()
    })
  }, [supabase, offerId])
  return null
}
