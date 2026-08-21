import {
  ArrowLeft,
  BookOpen,
  HandCoins,
  Receipt,
  Plus,
  Scale,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { NotesSection } from '@/features/notes/NotesSection'
import { ReminderList } from '@/features/notes/ReminderList'
import { ReminderModal } from '@/features/notes/ReminderModal'
import { Timeline } from '@/features/notes/Timeline'
import { usePersonTimeline, useReminders } from '@/features/notes/queries'
import { usePersonSummary } from '@/features/people/queries'
import { formatAbsMoney, formatMoney, toCents } from '@/lib/money'
import { cn } from '@/lib/utils'

export function PersonDetailPage() {
  const { personId } = useParams<{ personId: string }>()

  // Null until the first response says which currencies this pair actually uses.
  // Defaulting straight to the viewer's profile currency lets the page announce
  // "Settled up" for someone who owes a fortune in another one — a false statement,
  // not just an empty view.
  const [chosenCurrency, setChosenCurrency] = useState<string | null>(null)

  const probe = usePersonSummary(personId)
  const available = probe.data?.available_currencies ?? []
  const preferred =
    chosenCurrency ??
    (available.length > 0 && !available.includes(probe.data?.currency ?? '')
      ? available[0]
      : undefined)

  const { data, isLoading, isError, error, refetch } = usePersonSummary(
    personId,
    preferred,
  )
  const { data: timeline, isLoading: isTimelineLoading } = usePersonTimeline(personId, {
    limit: 50,
  })
  const { data: reminders } = useReminders({ person_user_id: personId, limit: 20 })

  const [isReminderOpen, setReminderOpen] = useState(false)

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
        action={
          // More than one currency between you means one figure cannot tell the
          // whole story, so the others are one click away rather than invisible.
          available.length > 1 ? (
            <div className="flex flex-wrap gap-1">
              {available.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setChosenCurrency(code)}
                  aria-pressed={code === currency}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium transition',
                    code === currency
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300',
                  )}
                >
                  {code}
                </button>
              ))}
            </div>
          ) : undefined
        }
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
            note={
              data.loan_count === 0
                ? 'No open loans'
                : `${data.loan_count} open loan${data.loan_count === 1 ? '' : 's'}`
            }
            to={data.loan_count > 0 ? `/loans?borrower=${data.person.id}` : undefined}
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
        title="Reminders"
        description="What to chase with this person."
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setReminderOpen(true)}
            leftIcon={<Plus className="size-4" />}
            className="whitespace-nowrap"
          >
            Add reminder
          </Button>
        }
      >
        <ReminderList
          reminders={reminders?.items ?? []}
          emptyTitle="No reminders for them"
          emptyDescription="Add one to be told when a payment is due."
        />
      </Card>

      <NotesSection
        subject={{ person_user_id: data.person.id }}
        description={`Context about ${data.person.full_name} that a number cannot carry.`}
      />

      {/*
        The timeline replaces the flat activity list. Both showed the same events,
        but the timeline orders by the date each thing happened rather than when it
        was typed in, groups by day, and includes loans and notes — which is what
        makes it read as a history rather than a log.
      */}
      <Card
        title="Timeline"
        description="Everything between you, in the order it happened."
      >
        <Timeline
          items={timeline?.items}
          isLoading={isTimelineLoading}
          emptyDescription={`Add ${data.person.full_name} to an expense, open a khata, or give them a loan.`}
        />
      </Card>
      {personId && (
        <ReminderModal
          isOpen={isReminderOpen}
          onClose={() => setReminderOpen(false)}
          subject={{ person_user_id: personId }}
          subjectLabel={data.person.full_name}
          defaultCurrency={currency}
        />
      )}
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
