import { HandCoins, Plus, Receipt, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { BarChart, type BarDatum } from '@/components/charts/BarChart'
import { ChartFrame, ChartTable } from '@/components/charts/ChartFrame'
import { ColumnChart, type ColumnDatum } from '@/components/charts/ColumnChart'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { useDashboard } from '@/features/analytics/queries'
import { useAuth } from '@/features/auth/use-auth'
import { TotalBalanceHero } from '@/features/balances/BalanceCards'
import { PersonBalanceRow } from '@/features/balances/BalanceList'
import { ExpenseList } from '@/features/expenses/ExpenseList'
import { ActivityFeed } from '@/features/settlements/ActivityFeed'
import { useFriends } from '@/features/friends/queries'
import { SettleUpModal } from '@/features/settlements/SettleUpModal'
import { useActivity } from '@/features/settlements/queries'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type Granularity,
  type PersonBalance,
} from '@/types/api'

/** Named windows rather than two date pickers — this is how people actually think. */
const RANGES = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
] as const

/**
 * The time-series chart covers a fixed window per granularity, independent of the
 * Period filter: a day-by-day chart over a year would be 365 unreadable bars, and
 * a month-by-month chart of 30 days would be a single one. Each states its own
 * range in the subtitle so the two are never confused.
 */
const SERIES_WINDOW: Record<Granularity, { count: number; label: string }> = {
  daily: { count: 30, label: 'last 30 days' },
  monthly: { count: 12, label: 'last 12 months' },
}

function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data: friends } = useFriends()

  const [range, setRange] = useState<(typeof RANGES)[number]['value']>('180')
  const [category, setCategory] = useState<ExpenseCategory | 'all'>('all')
  const [granularity, setGranularity] = useState<Granularity>('daily')
  const [settleWith, setSettleWith] = useState<PersonBalance | null>(null)
  const [isSettleOpen, setSettleOpen] = useState(false)

  const params = useMemo(
    () => ({
      start_date: range === 'all' ? undefined : isoDaysAgo(Number(range)),
      granularity,
      count: SERIES_WINDOW[granularity].count,
    }),
    [range, granularity],
  )

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useDashboard(params)
  // The merged expense + settlement feed, which the dashboard summary does not
  // cover: recent_settlements alone hides expenses other people added.
  const { data: activity } = useActivity({ limit: 6 })

  const currency = data?.window.currency ?? user?.currency ?? 'USD'
  const firstName = (user?.full_name ?? '').split(' ')[0]

  // The category filter narrows the charts and the spend headline. Balances are
  // deliberately unfiltered: what you owe is not a function of the window.
  const categories = data?.by_category ?? []
  const visibleCategories =
    category === 'all' ? categories : categories.filter((row) => row.category === category)

  const filteredSpend = visibleCategories.reduce((total, row) => total + Number(row.amount), 0)

  const points = data?.series.points ?? []
  const isMonthly = (data?.series.granularity ?? granularity) === 'monthly'

  const seriesData: ColumnDatum[] = points.map((row, index) => {
    // Parsed as local time, not UTC: `new Date('2026-08-20')` is midnight UTC and
    // renders as the 19th anywhere west of Greenwich.
    const when = new Date(`${row.start}T00:00:00`)
    return {
      label: isMonthly
        ? when.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : when.toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }),
      shortLabel: isMonthly
        ? when.toLocaleDateString(undefined, { month: 'short' })
        : String(when.getDate()),
      value: Number(row.amount),
      isCurrent: index === points.length - 1,
    }
  })

  // Stated in the chart's own subtitle, because the window is not the one the
  // Period filter governs.
  const seriesTotal = seriesData.reduce((sum, point) => sum + point.value, 0)
  const activeBuckets = seriesData.filter((point) => point.value > 0).length

  const categoryData: BarDatum[] = visibleCategories.map((row) => ({
    key: row.category,
    label: titleCase(row.category),
    value: Number(row.amount),
  }))

  const groupData: BarDatum[] = (data?.by_group ?? []).map((row) => ({
    key: row.group.id,
    label: row.group.name,
    value: Number(row.amount),
    glyph: row.group.emoji ?? undefined,
  }))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-3">
          <CardSkeleton lines={1} />
          <CardSkeleton lines={1} />
          <CardSkeleton lines={1} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton lines={5} />
          <CardSkeleton lines={5} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState error={error} title="Could not load your dashboard" onRetry={() => refetch()} />
    )
  }

  const hasAnyData = (data?.expense_count ?? 0) > 0

  return (
    <div className={cn('space-y-6', isPlaceholderData && 'opacity-60 transition-opacity')}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {firstName ? `Hi, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here is where your shared money stands.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setSettleWith(null)
              setSettleOpen(true)
            }}
            leftIcon={<HandCoins className="size-4" />}
            disabled={(friends?.length ?? 0) === 0}
            title={(friends?.length ?? 0) === 0 ? 'Add a friend first' : undefined}
          >
            Settle up
          </Button>
          <Link
            to="/expenses"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Plus aria-hidden className="size-4" />
            Add expense
          </Link>
        </div>
      </header>

      {/* Balances first: the question people open the app to answer. */}
      <TotalBalanceHero totals={data?.balances ?? []} />

      {data && data.people.length > 0 && (
        <Card title="Who owes whom" description="Across every group and friend.">
          <ul className="divide-y divide-slate-100">
            {data.people.map((entry) => (
              <PersonBalanceRow
                key={`${entry.user.id}-${entry.currency}`}
                entry={entry}
                onSettle={(person) => {
                  setSettleWith(person)
                  setSettleOpen(true)
                }}
              />
            ))}
          </ul>
        </Card>
      )}

      {/* Filters sit in one row above the charts they govern. */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select
            label="Period"
            options={RANGES.map((option) => ({ value: option.value, label: option.label }))}
            value={range}
            onChange={(event) => setRange(event.target.value as typeof range)}
          />
        </div>
        <div className="w-48">
          <Select
            label="Category"
            options={[
              { value: 'all', label: 'All categories' },
              ...EXPENSE_CATEGORIES.map((value) => ({ value, label: titleCase(value) })),
            ]}
            value={category}
            onChange={(event) => setCategory(event.target.value as ExpenseCategory | 'all')}
          />
        </div>
        <p className="pb-2 text-sm text-slate-500">
          You spent{' '}
          <span className="font-semibold tabular-nums text-slate-900">
            {formatMoney(filteredSpend, currency)}
          </span>{' '}
          {category === 'all' ? 'in total' : `on ${category}`}
        </p>
      </div>

      {!hasAnyData ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="No spending yet"
            description="Create a group or add a friend, then log your first shared expense to see it charted here."
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
        </Card>
      ) : (
        <>
          <ChartFrame
            title="Spending over time"
            subtitle={
              seriesTotal > 0
                ? `${formatMoney(seriesTotal, currency)} over the ${SERIES_WINDOW[granularity].label}, across ${activeBuckets} ${isMonthly ? 'month' : 'day'}${activeBuckets === 1 ? '' : 's'}.`
                : `Your share of expenses, ${isMonthly ? 'month by month' : 'day by day'} — ${SERIES_WINDOW[granularity].label}.`
            }
            summary={`Spending in ${currency}, ${isMonthly ? 'by month' : 'by day'}, over the ${SERIES_WINDOW[granularity].label}. ${seriesData
              .filter((point) => point.value > 0)
              .map((point) => `${point.label}: ${formatMoney(point.value, currency)}`)
              .join('. ')}`}
            isEmpty={seriesTotal === 0}
            emptyMessage={`No spending in the ${SERIES_WINDOW[granularity].label}.`}
            action={
              <div role="tablist" aria-label="Granularity" className="flex rounded-lg bg-slate-100 p-0.5">
                {(['daily', 'monthly'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={granularity === option}
                    onClick={() => setGranularity(option)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                      granularity === option
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            }
            table={
              <ChartTable
                columns={[isMonthly ? 'Month' : 'Day', 'Spent', 'Expenses']}
                rows={points.map((row) => [
                  row.bucket,
                  formatMoney(row.amount, currency),
                  row.expense_count,
                ])}
              />
            }
          >
            <ColumnChart data={seriesData} currency={currency} />
          </ChartFrame>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartFrame
              title="Spending by category"
              subtitle="Where your share went."
              summary={`Spending by category in ${currency}. ${categoryData
                .map((row) => `${row.label}: ${formatMoney(row.value, currency)}`)
                .join('. ')}`}
              isEmpty={categoryData.length === 0}
              table={
                <ChartTable
                  columns={['Category', 'Spent', 'Share', 'Expenses']}
                  rows={visibleCategories.map((row) => [
                    titleCase(row.category),
                    formatMoney(row.amount, currency),
                    `${row.share_of_total}%`,
                    row.expense_count,
                  ])}
                />
              }
            >
              <BarChart data={categoryData} currency={currency} />
            </ChartFrame>

            <ChartFrame
              title="Spending by group"
              subtitle="Your share in each group."
              summary={`Spending by group in ${currency}. ${groupData
                .map((row) => `${row.label}: ${formatMoney(row.value, currency)}`)
                .join('. ')}`}
              isEmpty={groupData.length === 0}
              emptyMessage="No group spending in this period."
              table={
                <ChartTable
                  columns={['Group', 'Spent']}
                  rows={(data?.by_group ?? []).map((row) => [
                    row.group.name,
                    formatMoney(row.amount, currency),
                  ])}
                />
              }
            >
              <BarChart data={groupData} currency={currency} />
            </ChartFrame>
          </div>

          {data && data.groups.length > 0 && (
            <Card title="Group statistics" description="Totals and your position in each.">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th scope="col" className="pb-2 font-medium">Group</th>
                      <th scope="col" className="pb-2 text-right font-medium">Total</th>
                      <th scope="col" className="pb-2 text-right font-medium">Your share</th>
                      <th scope="col" className="pb-2 text-right font-medium">Your balance</th>
                      <th scope="col" className="hidden pb-2 text-right font-medium sm:table-cell">
                        Expenses
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.groups.map((row) => {
                      const net = Number(row.your_net)
                      return (
                        <tr key={row.group.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-2.5">
                            <Link
                              to={`/groups/${row.group.id}`}
                              className="font-medium text-slate-900 hover:text-brand-700"
                            >
                              {row.group.emoji ? `${row.group.emoji} ` : ''}
                              {row.group.name}
                            </Link>
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-slate-600">
                            {formatMoney(row.total_expenses, row.group.currency)}
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-slate-600">
                            {formatMoney(row.your_share, row.group.currency)}
                          </td>
                          <td
                            className={cn(
                              'py-2.5 text-right font-medium tabular-nums',
                              net > 0 ? 'text-emerald-600' : net < 0 ? 'text-red-600' : 'text-slate-400',
                            )}
                          >
                            {formatMoney(row.your_net, row.group.currency)}
                          </td>
                          <td className="hidden py-2.5 text-right tabular-nums text-slate-500 sm:table-cell">
                            {row.expense_count}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              title="Recent expenses"
              action={
                <Link to="/expenses" className="text-sm font-medium text-brand-700 hover:text-brand-800">
                  View all
                </Link>
              }
            >
              {data && data.recent_expenses.length > 0 ? (
                <ExpenseList expenses={data.recent_expenses} />
              ) : (
                <p className="py-4 text-sm text-slate-500">No expenses yet.</p>
              )}
            </Card>

            <Card
              title="Recent activity"
              action={
                <Link to="/activity" className="text-sm font-medium text-brand-700 hover:text-brand-800">
                  View all
                </Link>
              }
            >
              {activity && activity.items.length > 0 ? (
                <ActivityFeed items={activity.items} />
              ) : (
                <p className="py-4 text-sm text-slate-500">Nothing has happened yet.</p>
              )}
            </Card>
          </div>
        </>
      )}

      <SettleUpModal
        isOpen={isSettleOpen}
        onClose={() => setSettleOpen(false)}
        candidates={[...(user ? [user] : []), ...(friends?.map((friend) => friend.user) ?? [])]}
        currency={settleWith?.currency ?? currency}
        defaultCounterpartyId={settleWith?.user.id}
      />
    </div>
  )
}
