import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  HandCoins,
  Receipt,
  Scale,
  Users,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { usePersonActivity, usePersonSummary } from '@/features/people/queries'
import { formatAbsMoney, formatMoney, toCents } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import type { PersonActivityItem } from '@/types/api'

export function PersonDetailPage() {
  const { personId } = useParams<{ personId: string }>()

  const { data, isLoading, isError, error, refetch } = usePersonSummary(personId)
  const { data: activity } = usePersonActivity(personId, { limit: 25 })

  if (isLoading) return <CardSkeleton lines={8} />
  if (isError || !data) {
    return <ErrorState error={error} title="Could not load this person" onRetry={() => refetch()} />
  }

  const { balances, currency } = data
  const total = toCents(balances.total_balance)
  const settled = total === 0

  return (
    <div className="space-y-6">
      <Link
        to="/people"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All people
      </Link>

      {/* One number first, then the parts it is made of — the whole point of the
          page is that the three subsystems add up to a single answer. */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={data.person.full_name} src={data.person.avatar_url} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {data.person.full_name}
              </h1>
              <p className="text-sm text-slate-500">{data.person.email}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-slate-500">
              {settled ? 'Total balance' : total > 0 ? 'They owe you' : 'You owe them'}
            </p>
            <p
              className={cn(
                'mt-1 text-3xl font-semibold tabular-nums sm:text-4xl',
                settled ? 'text-slate-900' : total > 0 ? 'text-emerald-600' : 'text-red-600',
              )}
            >
              {settled
                ? formatMoney(0, currency)
                : formatAbsMoney(balances.total_balance, currency)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {settled ? 'Settled up' : `Across everything, in ${currency}`}
            </p>
          </div>
        </div>
      </Card>

      <Card
        title="Where it comes from"
        description={`Each part is signed the same way, so the total is their sum. Amounts in ${currency} only.`}
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Component
            icon={Receipt}
            label="Group expenses"
            value={balances.group_balance}
            currency={currency}
            note={
              data.shared_group_count === 1
                ? '1 shared group'
                : `${data.shared_group_count} shared groups`
            }
          />
          <Component
            icon={BookOpen}
            label="Khata"
            value={balances.khata_balance}
            currency={currency}
            note={data.khata_count === 0 ? 'No khata' : `${data.khata_count} khata`}
            to={data.khata_ids[0] ? `/khata/${data.khata_ids[0]}` : undefined}
          />
          <Component
            icon={HandCoins}
            label="Loans"
            value={balances.loan_balance}
            currency={currency}
            note="Not built yet"
            muted
          />
          <Component
            icon={Scale}
            label="Settled so far"
            value={balances.settled_total}
            currency={currency}
            note="Already counted above"
            muted
          />
        </dl>

        {/*
          Stated on the page, not just in the API docs: a breakdown that silently
          reports a component the app cannot compute would read as "you have no
          loans" rather than "loans do not exist here".
        */}
        <Alert tone="info" className="mt-4">
          There is no loans feature in Owsify yet, so <strong>Loans</strong> is always zero
          and contributes nothing to the total. It is shown so the breakdown is visibly
          complete rather than quietly missing a part.
        </Alert>

        {data.shared_groups.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Users aria-hidden className="size-4 text-slate-400" />
              Shared groups
            </p>
            <ul className="flex flex-wrap gap-2">
              {data.shared_groups.map((group) => (
                <li key={group.id}>
                  <Link
                    to={`/groups/${group.id}`}
                    className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  >
                    {group.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card
        title="Activity"
        description="Expenses, settlements and khata entries between you, newest first."
      >
        {!activity || activity.items.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nothing between you yet"
            description={`Add ${data.person.full_name} to an expense or open a khata for them.`}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {activity.items.map((item) => (
              <ActivityRow key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function Component({
  icon: Icon,
  label,
  value,
  currency,
  note,
  to,
  muted,
}: {
  icon: typeof Receipt
  label: string
  value: string
  currency: string
  note: string
  to?: string
  muted?: boolean
}) {
  const cents = toCents(value)

  const body = (
    <div
      className={cn(
        'h-full rounded-lg border border-slate-200 px-3 py-3',
        to && 'transition hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon aria-hidden className="size-3.5" />
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1 text-lg font-semibold tabular-nums',
          muted || cents === 0
            ? 'text-slate-900'
            : cents > 0
              ? 'text-emerald-600'
              : 'text-red-600',
        )}
      >
        {formatMoney(value, currency)}
      </dd>
      <p className="mt-0.5 text-xs text-slate-400">{note}</p>
    </div>
  )

  return to ? <Link to={to}>{body}</Link> : body
}

function ActivityRow({ item }: { item: PersonActivityItem }) {
  const impact = toCents(item.your_impact)
  const Icon = impact >= 0 ? ArrowUpRight : ArrowDownLeft

  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={cn(
          'rounded-md p-1.5',
          impact >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-900">{item.summary}</p>
        <p className="text-xs text-slate-500">
          {formatDate(item.occurred_at)}
          {item.group_name && ` · ${item.group_name}`}
          {item.kind === 'khata_entry' && ' · Khata'}
        </p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-sm font-medium tabular-nums',
            impact >= 0 ? 'text-emerald-600' : 'text-red-600',
          )}
        >
          {impact >= 0 ? '+' : '−'}
          {formatAbsMoney(item.your_impact, item.currency)}
        </p>
        {item.khata_id && (
          <Link to={`/khata/${item.khata_id}`} className="text-xs text-slate-400 hover:text-slate-700">
            View khata
          </Link>
        )}
      </div>
    </li>
  )
}
