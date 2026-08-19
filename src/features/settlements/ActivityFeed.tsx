import { HandCoins, Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'

import { formatAbsMoney, isZero, toCents } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import type { ActivityItem } from '@/types/api'

/**
 * "Sadiq added Dinner" / "Ali paid you".
 *
 * The sentence comes from the server so both sides read it correctly relative to
 * themselves, and each row also states what it did to the reader's balance.
 */
function ActivityRow({ item }: { item: ActivityItem }) {
  const isExpense = item.type === 'expense'
  const Icon = isExpense ? Receipt : HandCoins
  const impact = toCents(item.your_impact)

  const body = (
    <div className="flex items-center gap-3 px-1 py-3">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          isExpense ? 'bg-slate-100 text-slate-500' : 'bg-brand-50 text-brand-700',
        )}
      >
        <Icon aria-hidden className="size-4.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{item.summary}</p>
        <p className="truncate text-xs text-slate-500">
          {formatAbsMoney(item.amount, item.currency)}
          {item.group ? ` · ${item.group.emoji ?? ''} ${item.group.name}` : ''} ·{' '}
          {formatDate(item.occurred_at)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {isZero(item.your_impact) ? (
          <p className="text-xs text-slate-400">no effect on you</p>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              {isExpense
                ? impact > 0
                  ? 'you lent'
                  : 'you borrowed'
                : impact > 0
                  ? 'you paid'
                  : 'you received'}
            </p>
            <p
              className={cn(
                'text-sm font-semibold tabular-nums',
                impact > 0 ? 'text-emerald-600' : 'text-red-600',
              )}
            >
              {formatAbsMoney(item.your_impact, item.currency)}
            </p>
          </>
        )}
      </div>
    </div>
  )

  // Expenses have a detail page; settlements are fully described by their row.
  return (
    <li>
      {isExpense ? (
        <Link
          to={`/expenses/${item.id}`}
          className="block transition-colors hover:bg-slate-50"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  )
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <ActivityRow key={`${item.type}-${item.id}`} item={item} />
      ))}
    </ul>
  )
}
