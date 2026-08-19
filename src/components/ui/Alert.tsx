import { AlertCircle, CheckCircle2, Info, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Tone = 'error' | 'success' | 'info'

const TONES: Record<Tone, { className: string; Icon: LucideIcon }> = {
  error: { className: 'bg-red-50 text-red-800 ring-red-200', Icon: AlertCircle },
  success: { className: 'bg-emerald-50 text-emerald-800 ring-emerald-200', Icon: CheckCircle2 },
  info: { className: 'bg-blue-50 text-blue-800 ring-blue-200', Icon: Info },
}

interface AlertProps {
  tone?: Tone
  title?: string
  children: ReactNode
  className?: string
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const { className: toneClass, Icon } = TONES[tone]

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg p-3 text-sm ring-1 ring-inset', toneClass, className)}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        {title && <p className="font-medium">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
