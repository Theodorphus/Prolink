import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          rows={4}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 shadow-sm resize-y',
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

Textarea.displayName = 'Textarea'
