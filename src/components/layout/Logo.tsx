import { Scale } from 'lucide-react'

import { env } from '@/config/env'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Scale aria-hidden className="size-4.5" />
      </span>
      <span className="text-base font-semibold tracking-tight text-slate-900">
        {env.appName}
      </span>
    </span>
  )
}
