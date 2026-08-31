import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    // Övergångar på färg och djup, inte bara färg. Ett litet lyft vid hover och
    // en nedtryckning vid klick gör knappen taktil i stället för platt.
    const base =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 ' +
      'disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0 ' +
      'active:translate-y-0'

    const variants = {
      primary:
        'bg-blue-700 text-white shadow-sm shadow-blue-900/20 hover:bg-blue-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/25',
      secondary:
        'bg-white text-slate-800 border border-slate-200 shadow-sm hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md',
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      danger:
        'bg-red-600 text-white shadow-sm shadow-red-900/20 hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-900/25',
    }

    const sizes = {
      sm: 'px-3.5 py-2 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3.5 text-base gap-2.5',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
