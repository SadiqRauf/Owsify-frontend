import { AlertTriangle, BellRing, CalendarClock } from 'lucide-react'
import { useState } from 'react'

import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Card } from '@/components/ui/Card'
import { ReminderList } from '@/features/notes/ReminderList'
import { useReminders } from '@/features/notes/queries'
import { cn } from '@/lib/utils'

type View = 'open' | 'overdue' | 'completed'

export function RemindersPage() {
  const [view, setView] = useState<View>('open')

  const { data, isLoading, isError, error, refetch } = useReminders(
    view === 'completed'
      ? { include_completed: true, status: 'completed', limit: 100 }
      : view === 'overdue'
        ? { status: 'overdue', limit: 100 }
        : { limit: 100 },
  )

  const reminders = data?.items ?? []
  const counts = data?.counts

  // Split for the "Upcoming" panel in the brief: what is late comes first, because
  // a queue that mixes the two buries the part that needs acting on.
  const overdue = reminders.filter((reminder) => reminder.status === 'overdue')
  const rest = reminders.filter((reminder) => reminder.status !== 'overdue')

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reminders</h1>
          <p className="mt-1 text-sm text-slate-500">
            What to chase, and when. Add a reminder from a khata, a loan or a person.
          </p>
        </div>
      </header>

      {counts && (
        <ul className="grid gap-3 sm:grid-cols-3">
          <CountTile
            icon={CalendarClock}
            label="Open"
            value={counts.open}
            tone="neutral"
            isActive={view === 'open'}
            onSelect={() => setView('open')}
          />
          <CountTile
            icon={AlertTriangle}
            label="Overdue"
            value={counts.overdue}
            tone="danger"
            isActive={view === 'overdue'}
            onSelect={() => setView('overdue')}
          />
          <CountTile
            icon={BellRing}
            label="Due today"
            value={counts.due_today}
            tone="brand"
            isActive={false}
            onSelect={() => setView('open')}
          />
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {(['open', 'overdue', 'completed'] as View[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setView(option)}
            aria-pressed={view === option}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium capitalize transition',
              view === option
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300',
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {isLoading && <CardSkeleton lines={5} />}

      {isError && (
        <ErrorState error={error} title="Could not load your reminders" onRetry={() => refetch()} />
      )}

      {data && view !== 'completed' && overdue.length > 0 && (
        <Card
          title="Overdue"
          description="Past its date, with nothing recorded against it yet."
        >
          <ReminderList reminders={overdue} />
        </Card>
      )}

      {data && (
        <Card
          title={
            view === 'completed' ? 'Completed' : overdue.length > 0 ? 'Upcoming' : 'Reminders'
          }
          description={
            view === 'completed'
              ? 'Done, with the date each was finished.'
              : 'Soonest first, because this list is a queue of work.'
          }
        >
          <ReminderList
            reminders={view === 'completed' ? reminders : rest}
            emptyTitle={
              view === 'completed'
                ? 'Nothing completed yet'
                : view === 'overdue'
                  ? 'Nothing overdue'
                  : 'Nothing to chase'
            }
            emptyDescription={
              view === 'overdue'
                ? 'Everything with a date is still within it.'
                : 'Open a khata, a loan or a person and add a reminder there, so it knows what it is about.'
            }
          />
        </Card>
      )}
    </div>
  )
}

function CountTile({
  icon: Icon,
  label,
  value,
  tone,
  isActive,
  onSelect,
}: {
  icon: typeof BellRing
  label: string
  value: number
  tone: 'neutral' | 'danger' | 'brand'
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isActive}
        className={cn(
          'w-full rounded-card bg-white p-4 text-left shadow-sm ring-1 transition hover:shadow-md',
          isActive ? 'ring-brand-400' : 'ring-slate-200/70',
        )}
      >
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
          <Icon aria-hidden className="size-3.5" />
          {label}
        </p>
        <p
          className={cn(
            'mt-1 text-2xl font-semibold tabular-nums',
            tone === 'danger' && value > 0 ? 'text-red-600' : 'text-slate-900',
          )}
        >
          {value}
        </p>
      </button>
    </li>
  )
}
