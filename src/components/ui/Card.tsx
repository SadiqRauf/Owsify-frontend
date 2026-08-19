import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface CardProps {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ title, description, action, children, className }: CardProps) {
  return (
    <section
      className={cn(
        'rounded-card bg-white p-5 shadow-sm ring-1 ring-slate-200/70',
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
