'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ActionState = { error: string } | { success: true; redirectTo: string } | null

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string | null

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Fel e-post eller lösenord.' }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: redirectTo || '/' }
}

export async function register(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string

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
