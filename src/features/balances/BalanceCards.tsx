import { ArrowDownLeft, ArrowUpRight, Receipt, Scale, type LucideIcon } from 'lucide-react'

import { formatAbsMoney, formatMoney, toCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { CurrencyTotals } from '@/types/api'

interface CardProps {
  label: string
  value: string
  currency: string
  icon: LucideIcon
  /** Signed values keep their sign; one-directional totals are shown unsigned. */
  signed?: boolean
}

function StatCard({ label, value, currency, icon: Icon, signed = false }: CardProps) {
  const cents = toCents(value)

  const tone = signed
    ? cents > 0
      ? 'text-emerald-600 bg-emerald-50'
      : cents < 0
        ? 'text-red-600 bg-red-50'
        : 'text-slate-500 bg-slate-100'
    : label === 'You owe'
      ? 'text-red-600 bg-red-50'
      : label === 'You are owed'
        ? 'text-emerald-600 bg-emerald-50'
        : 'text-brand-700 bg-brand-50'

  const valueTone = signed
    ? cents > 0
      ? 'text-emerald-600'
      : cents < 0
        ? 'text-red-600'
        : 'text-slate-900'
    : label === 'You owe'
      ? 'text-red-600'
      : label === 'You are owed'
        ? 'text-emerald-600'
        : 'text-slate-900'

  return (
    <div className="rounded-card bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={cn('flex size-8 items-center justify-center rounded-lg', tone)}>
          <Icon aria-hidden className="size-4" />
        </span>
      </div>
      <p className={cn('mt-3 text-2xl font-semibold tabular-nums', valueTone)}>
        {signed ? formatMoney(value, currency) : formatAbsMoney(value, currency)}
      </p>
    </div>
  )
}

/**
 * The dashboard's headline: one total balance figure, with the two directions it
 * is made of underneath.
 *
 * Total balance is the number people open the app for, so it is a hero figure
 * rather than one of three equal tiles — a value competing with its own inputs
 * for attention reads as three unrelated numbers.
 */
export function TotalBalanceHero({ totals }: { totals: CurrencyTotals[] }) {
  // With no activity there is still a figure to state, just a zero one.
  const rows = totals.length > 0 ? totals : [{ currency: 'USD', owed_to_you: '0.00', you_owe: '0.00', net: '0.00' }]

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const cents = toCents(row.net)
        return (
          <div
            key={row.currency}
            className="rounded-card bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total balance{rows.length > 1 ? ` · ${row.currency}` : ''}
                </p>
                <p
                  className={cn(
                    'mt-1 text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl',
                    cents > 0 ? 'text-emerald-600' : cents < 0 ? 'text-red-600' : 'text-slate-900',
                  )}
                >
                  {formatMoney(row.net, row.currency)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {cents > 0
                    ? 'in your favour overall'
                    : cents < 0
                      ? 'you are behind overall'
                      : 'you are all square'}
                </p>
              </div>

              {/* The two halves the total is made of. */}
              <dl className="flex gap-8">
                <div>
                  <dt className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <ArrowUpRight aria-hidden className="size-4 text-red-600" />
                    You owe
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-red-600">
                    {formatAbsMoney(row.you_owe, row.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <ArrowDownLeft aria-hidden className="size-4 text-emerald-600" />
                    You are owed
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">
                    {formatAbsMoney(row.owed_to_you, row.currency)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * One row of cards per currency.
 *
 * Currencies are never combined into a single figure — adding USD to EUR would
 * produce a number that means nothing — so when someone has balances in more than
 * one, each gets its own labelled row.
 */
export function BalanceCards({ totals }: { totals: CurrencyTotals[] }) {
  if (totals.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="You are owed" value="0.00" currency="USD" icon={ArrowDownLeft} />
        <StatCard label="You owe" value="0.00" currency="USD" icon={ArrowUpRight} />
        <StatCard label="Net balance" value="0.00" currency="USD" icon={Scale} signed />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {totals.map((row) => (
        <div key={row.currency} className="space-y-2">
          {totals.length > 1 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {row.currency}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="You are owed"
              value={row.owed_to_you}
              currency={row.currency}
              icon={ArrowDownLeft}
            />
            <StatCard
              label="You owe"
              value={row.you_owe}
              currency={row.currency}
              icon={ArrowUpRight}
            />
            <StatCard
              label="Net balance"
              value={row.net}
              currency={row.currency}
              icon={Scale}
              signed
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** The four-tile summary used at the top of a group. */
export function GroupSummaryCards({
  totalExpenses,
  totalSettled,
  yourNet,
  currency,
}: {
  totalExpenses: string
  totalSettled: string
  yourNet: string
  currency: string
}) {
  const net = toCents(yourNet)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total expenses"
        value={totalExpenses}
        currency={currency}
        icon={Receipt}
      />
      <StatCard label="Settled up" value={totalSettled} currency={currency} icon={Scale} />
      <StatCard
        label="You are owed"
        value={net > 0 ? yourNet : '0.00'}
        currency={currency}
        icon={ArrowDownLeft}
      />
      <StatCard
        label="You owe"
        value={net < 0 ? yourNet : '0.00'}
        currency={currency}
        icon={ArrowUpRight}
      />
    </div>
  )
}
