import { HandCoins, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoanFormModal } from '@/features/loans/LoanFormModal'
import { LoanProgress } from '@/features/loans/LoanProgress'
import { dueLabel } from '@/features/loans/dueLabel'
import { LoanStatusBadge } from '@/features/loans/LoanStatusBadge'
import { useLoans } from '@/features/loans/queries'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatAbsMoney, formatMoney, toCents } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import type { Loan, LoanDirection, LoanStatus } from '@/types/api'

const PAGE_SIZE = 20

export function LoansListPage() {
  const navigate = useNavigate()
  // The person page links here with ?borrower=<id> to show just their loans.
  const [searchParams] = useSearchParams()
  const borrowerUserId = searchParams.get('borrower') ?? undefined
  const [term, setTerm] = useState('')
  const [status, setStatus] = useState<'' | LoanStatus>('')
  const [direction, setDirection] = useState<'' | LoanDirection>('')
  const [page, setPage] = useState(0)
  const [isFormOpen, setFormOpen] = useState(false)

  const search = useDebouncedValue(term).trim()

  const { data, isLoading, isError, error, refetch } = useLoans({
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(direction ? { direction } : {}),
    ...(borrowerUserId ? { borrower_user_id: borrowerUserId } : {}),
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const loans = data?.items ?? []
  const total = data?.total ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)
  const isFiltered = Boolean(search || status || direction || borrowerUserId)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Loans</h1>
          <p className="mt-1 text-sm text-slate-500">
            Money you have lent and borrowed, what has moved, and where it stands.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} leftIcon={<Plus className="size-4" />}>
          Record a loan
        </Button>
      </header>

      {borrowerUserId && (
        <Alert tone="info">
          Showing loans for one person only.{' '}
          <Link to="/loans" className="font-medium underline">
            Show every loan
          </Link>
        </Alert>
      )}

      {/* Totals describe every loan you have, not the filtered page — a filtered
          view must never make an outstanding book look clear. */}
      {data && data.totals.length > 0 && (
        <div className="space-y-4">
          {data.totals.map((bucket) => (
            <section key={bucket.currency} aria-label={`${bucket.currency} totals`}>
              {/* The currency is named once above the row rather than repeated in
                  each brick, so the three figures read as one set. */}
              {data.totals.length > 1 && (
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {bucket.currency}
                </h2>
              )}
              <dl className="grid gap-3 sm:grid-cols-3">
                <Brick
                  tone="given"
                  label="Loans given"
                  value={bucket.given_balance}
                  currency={bucket.currency}
                  detail={`${formatMoney(bucket.lent, bucket.currency)} lent · ${formatMoney(
                    bucket.repaid_to_you,
                    bucket.currency,
                  )} back`}
                />
                <Brick
                  tone="taken"
                  label="Loans taken"
                  value={bucket.taken_balance}
                  currency={bucket.currency}
                  detail={`${formatMoney(
                    bucket.borrowed,
                    bucket.currency,
                  )} borrowed · ${formatMoney(bucket.repaid_by_you, bucket.currency)} repaid`}
                />
                <Brick
                  tone="net"
                  label="Net"
                  value={bucket.net}
                  currency={bucket.currency}
                  detail={
                    toCents(bucket.net) > 0
                      ? 'In your favour'
                      : toCents(bucket.net) < 0
                        ? 'Against you'
                        : 'Square'
                  }
                />
              </dl>
              {bucket.overdue_count > 0 && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {formatMoney(bucket.overdue, bucket.currency)} overdue across{' '}
                  {bucket.overdue_count} loan{bucket.overdue_count === 1 ? '' : 's'}
                </p>
              )}
            </section>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative">
          <Input
            label="Search loans"
            placeholder="Name or description"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value)
              setPage(0)
            }}
            className="pl-9"
          />
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-[2.35rem] size-4 text-slate-400"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm('')}
              aria-label="Clear search"
              className="absolute right-2 top-[2.1rem] rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </div>
        <Select
          label="Direction"
          value={direction}
          onChange={(event) => {
            setDirection(event.target.value as '' | LoanDirection)
            setPage(0)
          }}
          options={[
            { value: '', label: 'Given and taken' },
            { value: 'given', label: 'Loans I gave' },
            { value: 'taken', label: 'Loans I took' },
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as '' | LoanStatus)
            setPage(0)
          }}
          options={[
            { value: '', label: 'All loans' },
            { value: 'active', label: 'Active' },
            { value: 'partially_paid', label: 'Part paid' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'paid', label: 'Paid' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </div>

      {isLoading && <CardSkeleton lines={6} />}

      {isError && (
        <ErrorState error={error} title="Could not load your loans" onRetry={() => refetch()} />
      )}

      {data && loans.length === 0 && (
        <EmptyState
          icon={HandCoins}
          title={isFiltered ? 'No loans match these filters' : 'No loans yet'}
          description={
            isFiltered
              ? 'Try a different search, or clear the status filter.'
              : 'Record money you lend or borrow, and every repayment against it, so you always know where it stands.'
          }
          action={
            isFiltered ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTerm('')
                  setStatus('')
                  setDirection('')
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setFormOpen(true)}>
                Record your first loan
              </Button>
            )
          }
        />
      )}

      {loans.length > 0 && (
        // min-w-0 on the items is load-bearing: a grid item defaults to
        // min-width:auto and so refuses to shrink below its content's min-content
        // width, which a long borrower name beside a nowrap amount pushes past the
        // viewport. Without it the truncation inside the card never gets to act.
        <ul className="grid gap-3 lg:grid-cols-2">
          {loans.map((loan) => (
            <li key={loan.id} className="min-w-0">
              <LoanCard loan={loan} />
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">
            {page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= lastPage}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <LoanFormModal
        isOpen={isFormOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(loan) => navigate(`/loans/${loan.id}`)}
      />
    </div>
  )
}

function LoanCard({ loan }: { loan: Loan }) {
  const due = dueLabel(loan.days_until_due)
  const isLate = loan.status === 'overdue'
  const isTaken = loan.direction === 'taken'

  return (
    <Link to={`/loans/${loan.id}`} className="block h-full">
      {/*
        The same two hues as the bricks above, carried as a left edge: the eye can
        sort the list by direction without reading a word. It is a secondary cue
        only — the row also says "You lent" or "You borrowed", so nothing here
        depends on seeing colour.
      */}
      <Card
        className={cn(
          'relative h-full overflow-hidden pl-5 transition hover:border-slate-300 hover:shadow-sm',
          isTaken ? 'ring-amber-200/70' : 'ring-emerald-200/70',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute inset-y-0 left-0 w-1.5',
            isTaken ? 'bg-amber-500' : 'bg-emerald-500',
          )}
        />
        <div className="flex items-start gap-3">
          <Avatar name={loan.display_name} src={loan.counterparty_user?.avatar_url} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-slate-900">{loan.display_name}</p>
              <LoanStatusBadge status={loan.status} />
            </div>
            {/* Which way the money went, in words — the amount alone cannot say,
                and the colour must never be the only thing that does. */}
            <p className="truncate text-sm">
              <span className={cn('font-medium', isTaken ? 'text-amber-700' : 'text-emerald-700')}>
                {isTaken ? 'You borrowed' : 'You lent'}
              </span>
              {loan.description && <span className="text-slate-500"> · {loan.description}</span>}
            </p>
          </div>
          <p className="whitespace-nowrap text-lg font-semibold tabular-nums text-slate-900">
            {formatMoney(loan.amount, loan.currency)}
          </p>
        </div>

        <LoanProgress
          className="mt-4"
          amount={loan.amount}
          paid={loan.paid}
          remaining={loan.remaining}
          currency={loan.currency}
        />

        {(due || loan.due_date) && (
          <p
            className={cn(
              'mt-3 text-sm',
              isLate ? 'font-medium text-red-600' : 'text-slate-500',
            )}
          >
            {due ?? `Due ${formatDate(loan.due_date!)}`}
            {loan.due_date && due && (
              <span className="text-slate-400"> · {formatDate(loan.due_date)}</span>
            )}
          </p>
        )}
      </Card>
    </Link>
  )
}

/**
 * One of the three figures the page leads with.
 *
 * Given and taken get their own hue, and the same two hues run through the loan
 * cards below — so the eye can sort the list by direction without reading. Colour
 * is never the only cue: each brick is labelled, and every card carries the words
 * "You lent" or "You borrowed".
 *
 * A negative value is always shown as a positive amount with a word for the
 * direction. "Loans taken: −PKR 30,000" is a double negative the reader has to
 * unpick; "PKR 30,000 · you owe" is not.
 */
function Brick({
  tone,
  label,
  value,
  currency,
  detail,
}: {
  tone: 'given' | 'taken' | 'net'
  label: string
  value: string
  currency: string
  detail: string
}) {
  const cents = toCents(value)

  const TONES = {
    given: { ring: 'ring-emerald-200/70', bar: 'bg-emerald-500', ink: 'text-emerald-700' },
    taken: { ring: 'ring-amber-200/70', bar: 'bg-amber-500', ink: 'text-amber-700' },
    net: { ring: 'ring-slate-200/70', bar: 'bg-slate-300', ink: 'text-slate-900' },
  } as const
  const style = TONES[tone]

  // Net already says which way it falls in its own detail line, so repeating the
  // direction there would state the same fact twice.
  const direction =
    tone === 'net' || cents === 0 ? null : cents > 0 ? 'they owe you' : 'you owe'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card bg-white p-4 pl-5 shadow-sm ring-1',
        style.ring,
      )}
    >
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1.5', style.bar)} />
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          tone === 'net' && cents > 0 && 'text-emerald-600',
          tone === 'net' && cents < 0 && 'text-red-600',
          tone !== 'net' && style.ink,
        )}
      >
        {formatAbsMoney(value, currency)}
      </dd>
      <p className="mt-0.5 text-xs text-slate-500">
        {direction ? `${direction} · ` : ''}
        {detail}
      </p>
    </div>
  )
}
