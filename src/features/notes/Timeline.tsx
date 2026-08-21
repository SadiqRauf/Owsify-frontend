import { BookOpen, HandCoins, Receipt, StickyNote, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { formatMoney } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import type { TimelineEntry, TimelineKind } from '@/types/api'

/**
 * Each kind gets an icon and a tone. Six sources land in one list, and without a
 * per-kind mark a reader has to parse every title to tell a loan from a note.
 */
const KIND_META: Record<
  TimelineKind,
  { icon: typeof Receipt; className: string; label: string }
> = {
  loan_given: { icon: HandCoins, className: 'bg-violet-50 text-violet-700', label: 'Loan given' },
  loan_taken: { icon: HandCoins, className: 'bg-amber-50 text-amber-700', label: 'Loan taken' },
  loan_payment: { icon: Wallet, className: 'bg-emerald-50 text-emerald-700', label: 'Repayment' },
  loan_repayment: { icon: Wallet, className: 'bg-amber-50 text-amber-700', label: 'Repayment' },
  khata_entry: { icon: BookOpen, className: 'bg-sky-50 text-sky-700', label: 'Khata' },
  expense: { icon: Receipt, className: 'bg-slate-100 text-slate-700', label: 'Expense' },
  settlement: { icon: Wallet, className: 'bg-emerald-50 text-emerald-700', label: 'Settlement' },
  note: { icon: StickyNote, className: 'bg-amber-50 text-amber-700', label: 'Note' },
}

export function Timeline({
  items,
  isLoading,
  emptyDescription,
}: {
  items: TimelineEntry[] | undefined
  isLoading?: boolean
  emptyDescription?: string
}) {
  if (isLoading && !items) return <CardSkeleton lines={5} />

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={StickyNote}
        title="Nothing here yet"
        description={emptyDescription ?? 'Money, notes and reminders will appear here in order.'}
      />
    )
  }

  // Grouped by day, so a date is printed once rather than on every row. The
  // server has already ordered by the date each thing happened.
  const days = groupByDay(items)

  return (
    <ol className="space-y-6">
      {days.map(([day, entries]) => (
        <li key={day}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {formatDate(day)}
          </h3>
          <ol className="space-y-2">
            {entries.map((entry) => (
              <li key={`${entry.kind}-${entry.id}`}>
                <TimelineRow entry={entry} />
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  )
}

function groupByDay(items: TimelineEntry[]): [string, TimelineEntry[]][] {
  const days = new Map<string, TimelineEntry[]>()
  for (const item of items) {
    const bucket = days.get(item.occurred_on)
    if (bucket) bucket.push(item)
    else days.set(item.occurred_on, [item])
  }
  return [...days.entries()]
}

function TimelineRow({ entry }: { entry: TimelineEntry }) {
  const meta = KIND_META[entry.kind]
  const Icon = meta.icon

  const body = (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-slate-200 p-3',
        entry.href && 'transition hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <span className={cn('mt-0.5 rounded-md p-1.5', meta.className)}>
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{entry.title}</p>
        {entry.detail && (
          <p
            className={cn(
              'text-sm text-slate-500',
              // A note's body is the substance of the row, so it is not truncated
              // the way an expense's group name can be.
              entry.kind === 'note' ? 'whitespace-pre-wrap' : 'truncate',
            )}
          >
            {entry.kind === 'note' ? `“${entry.detail}”` : entry.detail}
          </p>
        )}
      </div>
      {entry.amount && entry.currency && (
        <p className="whitespace-nowrap font-semibold tabular-nums text-slate-900">
          {formatMoney(entry.amount, entry.currency)}
        </p>
      )}
    </div>
  )

  return entry.href ? <Link to={entry.href}>{body}</Link> : body
}
