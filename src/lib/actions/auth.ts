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

export async function register(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  let email: string
  let password: string
  let name: string
  let role: 'customer' | 'provider'
  try {
    email = emailValue(formData.get('email'))
    password = requiredText(formData.get('password'), 'Lösenord', 6, 128)
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
    return { error: error.message }
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
