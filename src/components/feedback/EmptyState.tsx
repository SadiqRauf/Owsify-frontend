import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}>
      <span className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
