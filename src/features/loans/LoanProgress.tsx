import { formatMoney, toCents } from '@/lib/money'
import { cn } from '@/lib/utils'

/**
 * Paid against remaining, as one bar plus the two figures.
 *
 * The bar is decoration: the numbers beside it carry the same information, so the
 * proportion is never the only way to read the loan.
 */
export function LoanProgress({
  amount,
  paid,
  remaining,
  currency,
  className,
}: {
  amount: string
  paid: string
  remaining: string
  currency: string
  className?: string
}) {
  const total = toCents(amount)
  const done = toCents(paid)
  // Clamped, because an overpayment settles a loan rather than filling the bar
  // past its end.
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
  const settled = toCents(remaining) === 0

  return (
    <div className={className}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percent}% repaid`}
      >
        <div
          className={cn('h-full rounded-full', settled ? 'bg-emerald-500' : 'bg-brand-500')}
          style={{ width: `${percent}%` }}
        />
      </div>

      <dl className="mt-2 flex items-baseline justify-between gap-4 text-sm">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-slate-500">Paid</dt>
          <dd className="font-medium tabular-nums text-slate-900">
            {formatMoney(paid, currency)}
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-slate-500">Remaining</dt>
          <dd
            className={cn(
              'font-semibold tabular-nums',
              settled ? 'text-emerald-600' : 'text-slate-900',
            )}
          >
            {formatMoney(remaining, currency)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
