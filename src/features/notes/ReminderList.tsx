import { AlertTriangle, BellOff, Check, Clock, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatMoney } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import type { Reminder } from '@/types/api'

import { ReminderModal } from './ReminderModal'
import { reminderTiming } from './reminderTiming'
import { useDeleteReminder, useUpdateReminder } from './queries'

export function ReminderList({
  reminders,
  emptyTitle = 'Nothing to chase',
  emptyDescription = 'Reminders you add will show up here as their dates approach.',
}: {
  reminders: Reminder[]
  emptyTitle?: string
  emptyDescription?: string
}) {
  const updateReminder = useUpdateReminder()
  const deleteReminder = useDeleteReminder()

  const [editing, setEditing] = useState<Reminder | null>(null)
  const [deleting, setDeleting] = useState<Reminder | null>(null)

  if (reminders.length === 0) {
    return <EmptyState icon={BellOff} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <>
      <ul className="divide-y divide-slate-100">
        {reminders.map((reminder) => {
          const isLate = reminder.status === 'overdue'
          const isDone = reminder.status === 'completed'

          return (
            <li key={reminder.id} className="group flex items-start gap-3 py-3">
              {/* The completion control is a checkbox, not a menu item: marking a
                  reminder done is the action people take most. */}
              <button
                type="button"
                onClick={() =>
                  updateReminder.mutate({
                    reminderId: reminder.id,
                    input: { completed: !isDone },
                  })
                }
                aria-label={isDone ? `Reopen ${reminder.title}` : `Mark ${reminder.title} done`}
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition',
                  isDone
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 hover:border-brand-500',
                )}
              >
                {isDone && <Check aria-hidden className="size-3.5" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      'font-medium',
                      isDone ? 'text-slate-400 line-through' : 'text-slate-900',
                    )}
                  >
                    {reminder.title}
                  </p>
                  {isLate && (
                    <Badge tone="danger">
                      <AlertTriangle aria-hidden className="mr-1 inline size-3" />
                      Overdue
                    </Badge>
                  )}
                  {/* A reminder held back by a future remind_on is real but not yet
                      anyone's problem — saying so beats it looking forgotten. */}
                  {!reminder.is_surfaced && !isDone && (
                    <Badge tone="neutral">
                      <Clock aria-hidden className="mr-1 inline size-3" />
                      Silent until {formatDate(reminder.remind_on!)}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-slate-500">
                  <Link to={reminder.subject_ref.href} className="hover:text-slate-900">
                    {reminder.subject_ref.label}
                  </Link>
                  {' · '}
                  <span className={cn(isLate && 'font-medium text-red-600')}>
                    {reminderTiming(reminder)}
                  </span>
                  <span className="text-slate-400"> · {formatDate(reminder.due_date)}</span>
                </p>

                {reminder.notes && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">
                    {reminder.notes}
                  </p>
                )}
              </div>

              {reminder.amount && reminder.currency && (
                <p className="whitespace-nowrap font-semibold tabular-nums text-slate-900">
                  {formatMoney(reminder.amount, reminder.currency)}
                </p>
              )}

              <div className="flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => setEditing(reminder)}
                  aria-label={`Edit ${reminder.title}`}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                >
                  {isDone ? (
                    <RotateCcw aria-hidden className="size-4" />
                  ) : (
                    <Pencil aria-hidden className="size-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(reminder)}
                  aria-label={`Delete ${reminder.title}`}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-700"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {editing && (
        <ReminderModal
          isOpen
          onClose={() => setEditing(null)}
          reminder={editing}
          subject={{
            khata_id: editing.khata_id,
            loan_id: editing.loan_id,
            person_user_id: editing.person_user_id,
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await deleteReminder.mutateAsync(deleting.id)
        }}
        title="Delete this reminder"
        description={
          deleting
            ? `"${deleting.title}" will be removed. The money it refers to is unaffected.`
            : ''
        }
        confirmLabel="Delete reminder"
      />
    </>
  )
}
