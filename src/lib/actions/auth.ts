'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { SITE_URL } from '@/lib/site'
import type { ActionState } from '@/types/auth'
import { createClient } from '@/lib/supabase/server'
import {
  emailValue,
  InputValidationError,
  oneOf,
  requiredText,
  safeRelativePath,
} from '@/lib/validation'


export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  let email: string
  let password: string
  try {
    email = emailValue(formData.get('email'))
    password = passwordValue(formData.get('password'), 6)
  } catch (error) {
    return { error: error instanceof InputValidationError ? error.message : 'Ogiltiga uppgifter.' }
  }
  const redirectTo = safeRelativePath(formData.get('redirect'))

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Fel e-post eller lösenord.' }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo }
}

// Supabase returnerar engelska felmeddelanden. De som en användare faktiskt kan
// råka ut för vid registrering översätts; övriga fångas av ett generellt fallback
// så att interna detaljer inte visas i gränssnittet.
function registerErrorMessage(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('pwned') || normalized.includes('leaked') || normalized.includes('compromised')) {
    return 'Lösenordet finns med i kända dataläckor. Välj ett annat lösenord.'
  }
  if (normalized.includes('weak') || normalized.includes('password should contain')) {
    return 'Lösenordet är för svagt. Använd minst 8 tecken med stora och små bokstäver samt siffror.'
  }
  if (normalized.includes('at least') && normalized.includes('characters')) {
    return 'Lösenordet måste vara minst 8 tecken.'
  }
  if (normalized.includes('already registered') || normalized.includes('already exists')) {
    return 'Det finns redan ett konto med den e-postadressen.'
  }
  if (normalized.includes('invalid') && normalized.includes('email')) {
    return 'E-postadressen är ogiltig.'
  }
  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'För många försök. Vänta en stund och försök igen.'
  }

  return 'Kunde inte skapa kontot. Kontrollera uppgifterna och försök igen.'
}

export async function register(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  let email: string
  let password: string
  let name: string
  let role: 'customer' | 'provider'
  try {
    email = emailValue(formData.get('email'))
    password = passwordValue(formData.get('password'), 8)
    name = requiredText(formData.get('name'), 'Namn', 1, 100)
    role = oneOf(formData.get('role'), ['customer', 'provider'] as const, 'Roll')
  } catch (error) {
    return { error: error instanceof InputValidationError ? error.message : 'Ogiltiga uppgifter.' }
  }

  const redirectTo = safeRelativePath(formData.get('redirect'))
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  })

  if (error) {
    return { error: registerErrorMessage(error.message) }
  }

  revalidatePath('/', 'layout')
  if (!data.session) return { message: 'Kontot är skapat. Bekräfta din e-post via länken i mejlet innan du loggar in.' }
  return { success: true, redirectTo }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

function passwordValue(value: FormDataEntryValue | null, min: number): string {
  if (typeof value !== 'string' || value.length < min || value.length > 128) {
    throw new InputValidationError(`Lösenordet måste vara ${min}–128 tecken.`)
  }
  return value
}

export async function requestPasswordReset(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const email = emailValue(form.get('email'))
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
    })
    if (error) return { error: 'Mejlet kunde inte skickas. Vänta en stund och försök igen.' }
    return { message: 'Om adressen har ett konto får du ett mejl med en återställningslänk.' }
  } catch { return { error: 'Ange en giltig e-postadress.' } }
}

export async function resendConfirmation(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const email = emailValue(form.get('email'))
    const next = safeRelativePath(form.get('redirect'))
    const supabase = await createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: {
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    } })
    if (error) return { error: 'Kunde inte skicka bekräftelsen. Vänta en stund och försök igen.' }
    return { message: 'Om kontot väntar på bekräftelse skickas ett nytt mejl.' }
  } catch { return { error: 'Ange en giltig e-postadress.' } }
}

export async function resetPassword(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const password = passwordValue(form.get('password'), 8)
    if (password !== form.get('confirm')) return { error: 'Lösenorden stämmer inte överens.' }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Länken har gått ut. Begär en ny återställningslänk.' }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: 'Lösenordet kunde inte sparas. Kontrollera att det är tillräckligt starkt.' }
    return { success: true, redirectTo: '/' }
  } catch (error) { return { error: error instanceof Error ? error.message : 'Kunde inte ändra lösenordet.' } }
}
