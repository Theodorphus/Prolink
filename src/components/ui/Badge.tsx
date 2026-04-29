import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    open: { label: 'Öppet', variant: 'success' },
    closed: { label: 'Stängt', variant: 'default' },
    pending: { label: 'Inväntar svar', variant: 'warning' },
    accepted: { label: 'Accepterad', variant: 'success' },
    rejected: { label: 'Avslagen', variant: 'danger' },
  }
  const config = map[status] ?? { label: status, variant: 'default' as BadgeVariant }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
