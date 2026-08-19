import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const SIZES = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const

interface SpinnerProps {
  size?: keyof typeof SIZES
  label?: string
  className?: string
}

export function Spinner({ size = 'md', label = 'Loading', className }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex', className)}>
      <Loader2 aria-hidden className={cn('animate-spin text-brand-600', SIZES[size])} />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Full-viewport loader, used while the session is being resolved on first paint. */
export function FullPageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" label={label} />
        <p className="text-sm text-slate-500">{label}…</p>
      </div>
    </div>
  )
}
