'use client'

import { cn } from '@/lib/utils'
import { useT } from '@/i18n/client'
import { msg } from '@/i18n/msg.mjs'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

// Dämpade toner med en tunn ram i stället för mättade färgplattor. Statusen ska
// gå att läsa i en lista utan att skrika, och ramen ger den tyngd på vit yta.
const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200',
  success: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
  danger: 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-200',
  info: 'bg-accent-tint text-accent-deep ring-1 ring-inset ring-accent-ring',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// Statusen i en affär bär mycket betydelse, så varje läge får en egen punkt.
// Färg ensam räcker inte för färgblinda användare; texten är alltid med.
const DOTS: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-accent',
}

export function StatusBadge({ status }: { status: string }) {
  const t = useT()
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    open: { label: msg('Öppet'), variant: 'success' },
    closed: { label: msg('Stängt'), variant: 'default' },
    pending: { label: msg('Inväntar svar'), variant: 'warning' },
    accepted: { label: msg('Accepterad'), variant: 'success' },
    rejected: { label: msg('Avslagen'), variant: 'danger' },
    delivered: { label: msg('Levererad'), variant: 'info' },
    completed: { label: msg('Slutförd'), variant: 'success' },
  }
  const config = map[status] ?? { label: status, variant: 'default' as BadgeVariant }

  return (
    <Badge variant={config.variant}>
      <span className={cn('h-1.5 w-1.5 rounded-full', DOTS[config.variant])} aria-hidden />
      {t(config.label)}
    </Badge>
  )
}
