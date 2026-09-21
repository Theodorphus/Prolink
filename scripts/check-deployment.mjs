import nextEnv from '@next/env'

// Match Next.js environment loading, without printing values or secrets.
nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} })

const issues = []
const required = [
  'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL',
  'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_CONTACT_EMAIL', 'CRON_SECRET',
]
for (const name of required) {
  const value = process.env[name]?.trim()
  if (!value || /^(your-|din_|change-me|placeholder)/i.test(value)) issues.push(`${name}: saknas eller har ett exempelvärde.`)
}
for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_APP_URL']) {
  if (!process.env[name]) continue
  try {
    const url = new URL(process.env[name])
    if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      issues.push(`${name}: ska vara en publik HTTPS-adress utan sökväg eller inloggningsuppgifter.`)
    }
  } catch { issues.push(`${name}: ogiltig URL.`) }
}
for (const name of ['RESEND_FROM_EMAIL', 'NEXT_PUBLIC_CONTACT_EMAIL']) {
  if (process.env[name] && !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(process.env[name].trim())) issues.push(`${name}: ange en e-postadress utan visningsnamn.`)
}
if (process.env.CRON_SECRET && process.env.CRON_SECRET.trim().length < 32) issues.push('CRON_SECRET: använd minst 32 slumpmässiga tecken.')
for (const name of Object.keys(process.env)) {
  if (name.startsWith('NEXT_PUBLIC_') && /(SECRET|SERVICE_ROLE|RESEND_API)/.test(name)) issues.push(`${name}: en serverhemlighet får inte ha NEXT_PUBLIC_-prefix.`)
}
if (issues.length) {
  console.error('Driftkonfigurationen behöver kompletteras:\n' + issues.map(issue => `- ${issue}`).join('\n'))
  process.exitCode = 1
} else {
  console.log('Driftvariablernas format är kontrollerat. Inga hemligheter skrevs ut.')
}
console.log('Kontrollen verifierar inte driftmiljön, nycklarnas giltighet, DNS, mejlleverans, schemaläggning eller Supabase Auth-inställningar.')
