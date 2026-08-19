import { ArrowDownLeft, ArrowUpRight, Plus, Receipt, Scale, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/use-auth'
import { ExpenseList } from '@/features/expenses/ExpenseList'
import { useBalances, useExpenses } from '@/features/expenses/queries'
import { formatAbsMoney, formatMoney, toCents } from '@/lib/money'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { user } = useAuth()

  const {
    data: balances,
    isLoading: balancesLoading,
    isError,
    error,
    refetch,
  } = useBalances()
  const { data: recent, isLoading: expensesLoading } = useExpenses({ limit: 5 })

  const currency = balances?.currency ?? user?.currency ?? 'USD'
  const firstName = (user?.full_name ?? '').split(' ')[0]

  if (balancesLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-3">
          <CardSkeleton lines={1} />
          <CardSkeleton lines={1} />
          <CardSkeleton lines={1} />
        </div>
        <CardSkeleton lines={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState error={error} title="Could not load your dashboard" onRetry={() => refetch()} />
    )
  }

  const net = toCents(balances?.net ?? '0')

  const tiles = [
    {
      label: 'You are owed',
      value: balances?.total_owed_to_you ?? '0.00',
      icon: ArrowDownLeft,
      tone: 'text-emerald-600 bg-emerald-50',
      valueClass: 'text-emerald-600',
    },
    {
      label: 'You owe',
      value: balances?.total_you_owe ?? '0.00',
      icon: ArrowUpRight,
      tone: 'text-red-600 bg-red-50',
      valueClass: 'text-red-600',
    },
    {
      label: 'Net balance',
      value: balances?.net ?? '0.00',
      icon: Scale,
      tone: 'text-brand-700 bg-brand-50',
      valueClass: net > 0 ? 'text-emerald-600' : net < 0 ? 'text-red-600' : 'text-slate-900',
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {firstName ? `Hi, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here is where your shared money stands.</p>
        </div>
        <Link
          to="/expenses"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus aria-hidden className="size-4" />
          Add expense
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon, tone, valueClass }) => (
          <div key={label} className="rounded-card bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <span className={cn('flex size-8 items-center justify-center rounded-lg', tone)}>
                <Icon aria-hidden className="size-4" />
              </span>
            </div>
            <p className={cn('mt-3 text-2xl font-semibold tabular-nums', valueClass)}>
              {label === 'Net balance'
                ? formatMoney(value, currency)
                : formatAbsMoney(value, currency)}
            </p>
          </div>
        ))}
      </div>

      {balances && balances.entries.length > 0 && (
        <Card title="Who owes whom" description="Across every group and friend.">
          <ul className="divide-y divide-slate-100">
            {balances.entries.map((entry) => {
              const amount = toCents(entry.amount)
              return (
                <li key={entry.user.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={entry.user.full_name} src={entry.user.avatar_url} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    {amount > 0
                      ? `${entry.user.full_name} owes you`
                      : `You owe ${entry.user.full_name}`}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      amount > 0 ? 'text-emerald-600' : 'text-red-600',
                    )}
                  >
                    {formatAbsMoney(entry.amount, currency)}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Card
        title="Recent activity"
        action={
          recent && recent.items.length > 0 ? (
            <Link to="/expenses" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              View all
            </Link>
          ) : undefined
        }
      >
        {expensesLoading ? (
          <div className="space-y-2 py-2">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        ) : recent && recent.items.length > 0 ? (
          <ExpenseList expenses={recent.items} />
        ) : (
          <EmptyState
            icon={Receipt}
            title="No activity yet"
            description="Create a group or add a friend, then log your first shared expense."
            action={
              <div className="flex gap-2">
                <Link
                  to="/groups"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
                >
                  <Users aria-hidden className="size-4" />
                  New group
                </Link>
                <Link
                  to="/friends"
                  className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  Add a friend
                </Link>
              </div>
            }
          />
        )}
      </Card>
    </div>
  )
}
