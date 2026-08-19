import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, rows = 3, ...props },
  ref,
) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      <textarea
        id={fieldId}
        ref={ref}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900',
          'ring-1 ring-inset ring-slate-300 placeholder:text-slate-400',
          'focus:ring-2 focus:ring-inset focus:ring-brand-500',
          error && 'ring-red-400 focus:ring-red-500',
          className,
        )}
        {...props}
      />

      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
