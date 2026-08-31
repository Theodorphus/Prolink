import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

interface RootCardProps extends CardProps {
  /** Ger kortet hover-lyft. Använd bara när hela kortet är klickbart. */
  interactive?: boolean
}

export function Card({ children, className, interactive }: RootCardProps) {
  return (
    <div className={cn('surface', interactive && 'surface-interactive', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('px-6 py-5 border-b border-slate-100', className)}>{children}</div>
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-100 bg-slate-50/70 rounded-b-[1.25rem]', className)}>
      {children}
    </div>
  )
}
