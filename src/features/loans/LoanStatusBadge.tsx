import { AlertTriangle, Ban, CheckCircle2, Clock, CircleDashed, Undo2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { LoanStatus } from '@/types/api'

/**
 * Status carries an icon and a word, never colour alone — colour is unavailable to
 * a screen reader and unreliable for a colourblind reader, and "overdue" is exactly
 * the state that must not be missed.
 */
const META: Record<
  LoanStatus,
  { label: string; icon: typeof Clock; className: string }
> = {
  active: { label: 'Active', icon: CircleDashed, className: 'bg-slate-100 text-slate-700' },
  partially_paid: { label: 'Part paid', icon: Clock, className: 'bg-sky-100 text-sky-800' },
  paid: { label: 'Paid', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-800' },
  // Distinct from Paid on purpose: the two mean opposite things about who owes
  // whom. Paid is settled; overpaid means the debt now runs the other way.
  overpaid: { label: 'Overpaid', icon: Undo2, className: 'bg-violet-100 text-violet-800' },
  overdue: { label: 'Overdue', icon: AlertTriangle, className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', icon: Ban, className: 'bg-amber-100 text-amber-800' },
}

export function LoanStatusBadge({
  status,
  className,
}: {
  status: LoanStatus
  className?: string
}) {
  const meta = META[status]
  const Icon = meta.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        meta.className,
        className,
      )}
    >
      <Icon aria-hidden className="size-3" />
      {meta.label}
    </span>
  )
}
