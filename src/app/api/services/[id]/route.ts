import { after, NextRequest, NextResponse } from 'next/server'
import { warmTranslation } from '@/lib/content-translation'
import { createClient } from '@/lib/supabase/server'
import { InputValidationError, isUuid } from '@/lib/validation'
import { parseServiceContent } from '@/lib/service-input'

// Frilansaren redigerar sin egen tjänst. Raden filtreras på provider_id, och
// databasen tillåter dessutom bara innehållskolumnerna att ändras.
export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Ogiltig tjänst' }, { status: 400 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  let content
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object') throw new InputValidationError('Ogiltig förfrågan.')
    content = parseServiceContent(body)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('services')
    .update(content)
    .eq('id', params.id)
    .eq('provider_id', user.id)
    .select('id, title, description')
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Tjänsten kunde inte uppdateras.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Tjänsten hittades inte.' }, { status: 404 })
  after(() => warmTranslation('service', data))
  return NextResponse.json({ id: data.id })
}
