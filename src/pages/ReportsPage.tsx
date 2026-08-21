import { ArrowDownLeft, ArrowUpRight, BookOpen, FileText, HandCoins, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { GroupedColumnChart, type GroupedDatum } from '@/components/charts/GroupedColumnChart'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoanStatusBadge } from '@/features/loans/LoanStatusBadge'
import {
  useActivityReport,
  useKhataReport,
  useLoanReport,
  useSummaryReport,
} from '@/features/reports/queries'
import { useAuth } from '@/features/auth/use-auth'
import { formatMoney, toCents } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'

/** The month a report defaults to, as the API would compute it. */
function currentMonth(): { start: string; end: string } {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: iso(first), end: iso(last) }
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function ReportsPage() {
  const { user } = useAuth()
  const month = currentMonth()

  const [startDate, setStartDate] = useState(month.start)
  const [endDate, setEndDate] = useState(month.end)
  // Null until the first response says which currencies have anything in them.
  // Defaulting straight to the profile currency would open Reports on a page of
  // zeroes for anyone whose khatas are in a different one, which reads as a broken
  // report rather than a currency mismatch.
  const [chosenCurrency, setChosenCurrency] = useState<string | null>(null)
  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('monthly')

  // The probe runs against the profile currency purely to learn what is available;
  // its figures are only used once that turns out to be the right currency.
  const probe = useSummaryReport({
    start_date: startDate,
    end_date: endDate,
    currency: user?.currency,
  })

  const available = probe.data?.available_currencies ?? []
  const currency =
    chosenCurrency ??
    (available.length > 0 && !available.includes(user?.currency ?? '')
      ? available[0]
      : (user?.currency ?? 'PKR'))

  const params = { start_date: startDate, end_date: endDate, currency }

  const summary = useSummaryReport(params)
  const khata = useKhataReport(params)
  const loans = useLoanReport(params)

  // The activity chart deliberately looks wider than the report window: a single
  // month of monthly buckets is one bar, which says nothing about a trend.
  const activityParams = useMemo(() => {
    if (granularity === 'daily') {
      return {
        start_date: startDate,
        end_date: endDate,
        currency,
        granularity: 'daily' as const,
      }
    }
    const end = new Date(endDate)
    const start = new Date(end.getFullYear(), end.getMonth() - 5, 1)
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      start_date: iso(start),
      end_date: endDate,
      currency,
      granularity: 'monthly' as const,
    }
  }, [granularity, startDate, endDate, currency])

  const activity = useActivityReport(activityParams)

  const flow = summary.data?.flow
  const window = summary.data?.window

  const chartData: GroupedDatum[] = (activity.data?.points ?? []).map((point) => {
    const isMonthly = point.period.length === 7
    const [year, month, day] = point.period.split('-')
    return {
      label: isMonthly
        ? `${MONTH_NAMES[Number(month) - 1]} ${year}`
        : formatDate(point.period),
      shortLabel: isMonthly ? MONTH_NAMES[Number(month) - 1] : String(Number(day)),
      values: [Number(point.given), Number(point.received)],
    }
  })

  const loanChartData: GroupedDatum[] = (activity.data?.points ?? []).map((point) => {
    const isMonthly = point.period.length === 7
    const [year, month, day] = point.period.split('-')
    return {
      label: isMonthly
        ? `${MONTH_NAMES[Number(month) - 1]} ${year}`
        : formatDate(point.period),
      shortLabel: isMonthly ? MONTH_NAMES[Number(month) - 1] : String(Number(day)),
      values: [Number(point.lent), Number(point.repaid)],
    }
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          {window ? window.label : 'This month'} · all figures in {currency}
        </p>
      </header>

      {/* Filters in one row above the figures they control. */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="From"
            type="date"
            value={startDate}
            max={endDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
          <CurrencySelect
            ensureCode={currency}
            value={currency}
            onChange={(event) => setChosenCurrency(event.target.value)}
          />
          <Select
            label="Chart period"
            value={granularity}
            onChange={(event) => setGranularity(event.target.value as 'daily' | 'monthly')}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'daily', label: 'Daily' },
            ]}
          />
        </div>
      </Card>

      {available.length > 0 && !available.includes(currency) && (
        <Alert tone="info">
          Nothing is recorded in {currency}. You have money in{' '}
          {available.slice(0, 3).join(', ')} — pick one above to see it.
        </Alert>
      )}

      {summary.isLoading && <CardSkeleton lines={6} />}
      {summary.isError && (
        <ErrorState
          error={summary.error}
          title="Could not load the report"
          onRetry={() => summary.refetch()}
        />
      )}

      {flow && (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Figure
              icon={ArrowUpRight}
              label="Money given"
              value={flow.money_given}
              currency={currency}
            />
            <Figure
              icon={ArrowDownLeft}
              label="Money received"
              value={flow.money_received}
              currency={currency}
            />
            <Figure
              icon={HandCoins}
              label="Loans given"
              value={flow.loans_given}
              currency={currency}
            />
            <Figure
              icon={Wallet}
              label="Loan payments"
              value={flow.loan_payments}
              currency={currency}
              note="Repaid to you"
            />
            <Figure
              icon={HandCoins}
              label="Loans taken"
              value={flow.loans_taken}
              currency={currency}
            />
            <Figure
              icon={Wallet}
              label="Repayments made"
              value={flow.loan_repayments_made}
              currency={currency}
              note="Repaid by you"
            />
            {/*
              The last two are positions rather than flows, and say so: what you are
              owed does not reset because a month ended, and a reader who assumed it
              did would draw the wrong conclusion from a quiet period.
            */}
            <Figure
              icon={BookOpen}
              label="Khata receivable"
              value={flow.khata_receivable}
              currency={currency}
              note="As of today, not just this period"
            />
            <Figure
              icon={HandCoins}
              label="Loans receivable"
              value={flow.loans_receivable}
              currency={currency}
              note="As of today, not just this period"
            />
            <Figure
              icon={HandCoins}
              label="Loans payable"
              value={flow.loans_payable}
              currency={currency}
              note="Owed by you, overpayments included"
            />
          </ul>

          <Card>
            <p className="text-sm font-medium text-slate-500">Net movement this period</p>
            <p
              className={cn(
                'mt-1 text-3xl font-semibold tabular-nums',
                toCents(flow.net_flow) >= 0 ? 'text-emerald-600' : 'text-red-600',
              )}
            >
              {formatMoney(flow.net_flow, currency)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Received and repaid, less given and lent. Positive means more came in than
              went out.
            </p>
          </Card>
        </>
      )}

      <Card
        title="Money given and received"
        description={
          granularity === 'monthly'
            ? 'The last six months, so the period has a trend to sit in.'
            : 'Day by day across the selected window.'
        }
      >
        {chartData.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nothing to chart yet"
            description="Khata entries in this currency will appear here."
          />
        ) : (
          <GroupedColumnChart
            data={chartData}
            series={['Given', 'Received']}
            currency={currency}
          />
        )}
      </Card>

      <Card
        title="Loans and repayments"
        description="Money lent against money coming back."
      >
        {loanChartData.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="Nothing to chart yet"
            description="Loans in this currency will appear here."
          />
        ) : (
          <GroupedColumnChart
            data={loanChartData}
            series={['Lent', 'Repaid']}
            currency={currency}
          />
        )}
      </Card>

      <Card
        title="Khata balances"
        description="Activity in the period, beside what each person owes right now."
      >
        {khata.isLoading && <CardSkeleton lines={4} />}
        {khata.data && khata.data.rows.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="No khatas in this currency"
            description="Open a khata to start tracking what people owe you."
          />
        )}
        {khata.data && khata.data.rows.length > 0 && (
          <div className="relative max-w-full overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <caption className="sr-only">
                Khata activity and standing balance per person.
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-3 py-2">Person</th>
                  <th scope="col" className="px-3 py-2 text-right">Given</th>
                  <th scope="col" className="px-3 py-2 text-right">Received</th>
                  <th scope="col" className="px-3 py-2 text-right">Balance now</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {khata.data.rows.map((row) => (
                  <tr key={row.khata_id ?? row.name} className="hover:bg-slate-50">
                    <th scope="row" className="px-3 py-2.5 text-left font-medium text-slate-900">
                      {row.khata_id ? (
                        <Link to={`/khata/${row.khata_id}`} className="hover:text-brand-700">
                          {row.name}
                        </Link>
                      ) : (
                        row.name
                      )}
                    </th>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                      {formatMoney(row.given, currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                      {formatMoney(row.received, currency)}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2.5 text-right font-medium tabular-nums',
                        toCents(row.balance) > 0
                          ? 'text-emerald-600'
                          : toCents(row.balance) < 0
                            ? 'text-red-600'
                            : 'text-slate-500',
                      )}
                    >
                      {formatMoney(row.balance, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 font-semibold">
                  <th scope="row" className="px-3 py-2.5 text-left">Total</th>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatMoney(khata.data.totals.given, currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatMoney(khata.data.totals.received, currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatMoney(khata.data.totals.balance, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Loans"
        description="Loans given and taken, with what was repaid inside the period."
      >
        {loans.isLoading && <CardSkeleton lines={4} />}
        {loans.data && loans.data.rows.length === 0 && (
          <EmptyState
            icon={HandCoins}
            title="No loans in this currency"
            description="Loans you give will be reported here."
          />
        )}
        {loans.data && loans.data.rows.length > 0 && (
          <div className="relative max-w-full overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <caption className="sr-only">Loans with amounts, status and due dates.</caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-3 py-2">Person</th>
                  <th scope="col" className="px-3 py-2">Direction</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2 text-right">Loan</th>
                  <th scope="col" className="px-3 py-2 text-right">Repaid in period</th>
                  <th scope="col" className="px-3 py-2 text-right">Balance</th>
                  <th scope="col" className="px-3 py-2">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.data.rows.map((row) => (
                  <tr key={row.loan_id} className="hover:bg-slate-50">
                    <th scope="row" className="px-3 py-2.5 text-left font-medium text-slate-900">
                      <Link to={`/loans/${row.loan_id}`} className="hover:text-brand-700">
                        {row.counterparty_name}
                      </Link>
                    </th>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                      {row.direction === 'taken' ? 'You took' : 'You gave'}
                    </td>
                    <td className="px-3 py-2.5">
                      <LoanStatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                      {formatMoney(row.amount, currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                      {formatMoney(row.paid_in_window, currency)}
                    </td>
                    {/* Signed, so a loan you took and an overpaid loan you gave
                        both read as money you owe rather than money you are owed. */}
                    <td
                      className={cn(
                        'px-3 py-2.5 text-right font-medium tabular-nums',
                        toCents(row.signed_balance) > 0
                          ? 'text-emerald-600'
                          : toCents(row.signed_balance) < 0
                            ? 'text-red-600'
                            : 'text-slate-500',
                      )}
                    >
                      {formatMoney(row.signed_balance, currency)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                      {row.due_date ? formatDate(row.due_date) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 font-semibold">
                  <th scope="row" colSpan={3} className="px-3 py-2.5 text-left">
                    Total
                  </th>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatMoney(loans.data.totals.lent, currency)} out ·{' '}
                    {formatMoney(loans.data.totals.borrowed, currency)} in
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatMoney(loans.data.totals.repaid_in_window, currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatMoney(loans.data.totals.net, currency)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function Figure({
  icon: Icon,
  label,
  value,
  currency,
  note,
}: {
  icon: typeof Wallet
  label: string
  value: string
  currency: string
  note?: string
}) {
  return (
    <li>
      <Card className="h-full">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
          <Icon aria-hidden className="size-3.5" />
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
          {formatMoney(value, currency)}
        </p>
        {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
      </Card>
    </li>
  )
}
