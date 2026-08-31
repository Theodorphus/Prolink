'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  emailValue,
  InputValidationError,
  oneOf,
  requiredText,
  safeRelativePath,
} from '@/lib/validation'

type ActionState = { error: string } | { success: true; redirectTo: string } | null

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  let email: string
  let password: string
  try {
    email = emailValue(formData.get('email'))
    password = requiredText(formData.get('password'), 'Lösenord', 6, 128)
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
    password = requiredText(formData.get('password'), 'Lösenord', 8, 128)
    name = requiredText(formData.get('name'), 'Namn', 1, 100)
    role = oneOf(formData.get('role'), ['customer', 'provider'] as const, 'Roll')
  } catch (error) {
    return { error: error instanceof InputValidationError ? error.message : 'Ogiltiga uppgifter.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
    },
  })

  if (error) {
    return { error: registerErrorMessage(error.message) }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: '/' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
