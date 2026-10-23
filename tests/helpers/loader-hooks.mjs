// Låter node --test köra TypeScript-moduler som använder @/-alias och
// server-only, och byter Supabase-klienten mot en minnesbaserad låtsasklient.
import { existsSync } from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const fakeAdmin = pathToFileURL(path.join(root, 'tests', 'helpers', 'fake-admin.mjs')).href

export async function resolve(specifier, context, next) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true }
  // after() finns bara under en förfrågan; utanför den kastar den, som i Next.
  if (specifier === 'next/server') return { url: 'data:text/javascript,export function after() { throw new Error("after() utanför en förfrågan") }', shortCircuit: true }
  if (specifier === '@/lib/supabase/admin') return { url: fakeAdmin, shortCircuit: true }
  if (specifier.startsWith('@/')) {
    const base = path.join(root, 'src', specifier.slice(2))
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, path.join(base, 'index.ts')]) {
      if (path.extname(candidate) && existsSync(candidate)) return next(pathToFileURL(candidate).href, context)
    }
  }
  return next(specifier, context)
}
