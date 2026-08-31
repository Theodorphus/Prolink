import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Kort förklaring under fältet, t.ex. format eller varför uppgiften behövs. */
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, name, ...props }, ref) => {
    const inputId = id ?? name
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-slate-800">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm',
            'placeholder:text-slate-400 transition-all duration-200',
            'focus:outline-none focus:ring-4',
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-100',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50',
            className
          )}
          {...props}
        />
        {/* Felet ersätter hjälptexten så fältet inte växer och hoppar. */}
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
