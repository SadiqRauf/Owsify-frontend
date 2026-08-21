import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  HandCoins,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoanFormModal } from '@/features/loans/LoanFormModal'
import { NotesSection } from '@/features/notes/NotesSection'
import { ReminderList } from '@/features/notes/ReminderList'
import { ReminderModal } from '@/features/notes/ReminderModal'
import { useReminders } from '@/features/notes/queries'
import { LoanPaymentModal } from '@/features/loans/LoanPaymentModal'
import { LoanProgress } from '@/features/loans/LoanProgress'
import { dueLabel } from '@/features/loans/dueLabel'
import { LoanStatusBadge } from '@/features/loans/LoanStatusBadge'
import {
  useDeleteLoan,
  useDeleteLoanPayment,
  useLoan,
  useLoanPayments,
  useSettleLoan,
  useUpdateLoan,
} from '@/features/loans/queries'
import { formatMoney, toCents } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import type { LoanPaymentWithProgress } from '@/types/api'

export function LoanDetailPage() {
  const { loanId } = useParams<{ loanId: string }>()
  const navigate = useNavigate()

  const { data: loan, isLoading, isError, error, refetch } = useLoan(loanId)
  const { data: payments } = useLoanPayments(loanId, { limit: 50 })

  const updateLoan = useUpdateLoan(loanId ?? '')
  const settleLoan = useSettleLoan(loanId ?? '')
  const deleteLoan = useDeleteLoan()
  const deletePayment = useDeleteLoanPayment(loanId ?? '')

  const { data: reminders } = useReminders({ loan_id: loanId, limit: 20 })

  const [isEditOpen, setEditOpen] = useState(false)
  const [isReminderOpen, setReminderOpen] = useState(false)
  const [isPayOpen, setPayOpen] = useState(false)
  const [isSettleOpen, setSettleOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const [deletingPayment, setDeletingPayment] = useState<LoanPaymentWithProgress | null>(null)

  if (isLoading) return <CardSkeleton lines={8} />
  if (isError || !loan) {
    return <ErrorState error={error} title="Could not load this loan" onRetry={() => refetch()} />
  }

  const outstanding = toCents(loan.remaining) > 0
  const isCancelled = loan.status === 'cancelled'
  const due = dueLabel(loan.days_until_due)

  const isTaken = loan.direction === 'taken'
  const overpaid = toCents(loan.overpaid)
  // Positive means they owe you, the same convention as everywhere else.
  const balance = toCents(loan.signed_balance)

  return (
    <div className="space-y-6">
      <Link
        to="/loans"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All loans
      </Link>

      {isCancelled && (
        <Alert tone="warning" title="This loan was written off">
          Its payment history is intact. Reopen it if that was a mistake.
        </Alert>
      )}

      {loan.status === 'overdue' && (
        <Alert tone="error" title={due ?? 'Overdue'}>
          {formatMoney(loan.remaining, loan.currency)}{' '}
          {isTaken ? 'was due from you on' : 'was due on'} {formatDate(loan.due_date!)}.
        </Alert>
      )}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={loan.display_name} src={loan.counterparty_user?.avatar_url} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                  {loan.display_name}
                </h1>
                <LoanStatusBadge status={loan.status} />
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {isTaken ? 'Loan taken' : 'Loan given'} {formatDate(loan.created_at)}
                {loan.counterparty_user && (
                  <>
                    {' · '}
                    <Link
                      to={`/people/${loan.counterparty_user.id}`}
                      className="text-brand-600 hover:text-brand-700"
                    >
                      View their profile
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-slate-500">
              {isTaken ? 'Borrowed from them' : 'Lent to them'}
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900 sm:text-4xl">
              {formatMoney(loan.amount, loan.currency)}
            </p>
            {loan.due_date && (
              <p
                className={cn(
                  'mt-1 text-sm',
                  loan.status === 'overdue' ? 'font-medium text-red-600' : 'text-slate-500',
                )}
              >
                Due {formatDate(loan.due_date)}
                {due && <span className="block text-xs text-slate-400">{due}</span>}
              </p>
            )}
          </div>
        </div>

        <LoanProgress
          className="mt-6"
          amount={loan.amount}
          paid={loan.paid}
          remaining={loan.remaining}
          currency={loan.currency}
        />

        {/*
          Once a loan is overpaid the interesting number is no longer what is left
          of the original debt — it is the amount now owed the other way, which the
          progress bar has no way to show.
        */}
        {overpaid > 0 && !isCancelled && (
          <Alert
            tone="info"
            title={
              balance < 0
                ? `You owe ${loan.display_name} ${formatMoney(loan.overpaid, loan.currency)}`
                : `${loan.display_name} owes you ${formatMoney(loan.overpaid, loan.currency)}`
            }
            className="mt-4"
          >
            {formatMoney(loan.paid, loan.currency)} came back against a{' '}
            {formatMoney(loan.amount, loan.currency)} loan, so the extra{' '}
            {formatMoney(loan.overpaid, loan.currency)} is owed the other way now.
          </Alert>
        )}

        {loan.description && (
          <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            {loan.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {outstanding && !isCancelled && (
            <Button onClick={() => setPayOpen(true)} leftIcon={<Plus className="size-4" />}>
              Add payment
            </Button>
          )}
          {outstanding && !isCancelled && (
            <Button
              variant="secondary"
              onClick={() => setSettleOpen(true)}
              leftIcon={<CheckCircle2 className="size-4" />}
            >
              Mark as paid
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditOpen(true)}
            leftIcon={<Pencil className="size-4" />}
          >
            Edit
          </Button>
          {isCancelled ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateLoan.mutate({ status: 'active' })}
              isLoading={updateLoan.isPending}
              leftIcon={<RotateCcw className="size-4" />}
            >
              Reopen
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateLoan.mutate({ status: 'cancelled' })}
              isLoading={updateLoan.isPending}
              leftIcon={<Ban className="size-4" />}
              className="text-amber-700 hover:bg-amber-50"
            >
              Write off
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            leftIcon={<Trash2 className="size-4" />}
            className="text-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </Card>

      <Card
        title="Repayments"
        description={
          isTaken
            ? 'Every payment you have made against this loan, newest first. The remaining amount is the principal less these rows.'
            : 'Every payment against this loan, newest first. The remaining amount is the principal less these rows.'
        }
        action={
          outstanding && !isCancelled ? (
            <Button
              size="sm"
              onClick={() => setPayOpen(true)}
              leftIcon={<Plus className="size-4" />}
              className="whitespace-nowrap"
            >
              Add payment
            </Button>
          ) : undefined
        }
      >
        {!payments || payments.items.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="No repayments yet"
            description={`The whole ${formatMoney(loan.amount, loan.currency)} is still outstanding.`}
            action={
              outstanding && !isCancelled ? (
                <Button size="sm" onClick={() => setPayOpen(true)}>
                  Record the first payment
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="relative max-w-full overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <caption className="sr-only">
                Repayments against {loan.display_name}&rsquo;s loan, with the amount left after
                each.
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-2">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Note
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Paid
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Left after
                  </th>
                  <th scope="col" className="px-4 py-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.items.map((payment) => (
                  <tr key={payment.id} className="group hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{payment.note ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-emerald-600">
                      {formatMoney(payment.amount, loan.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-900">
                      {formatMoney(payment.remaining_after, loan.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDeletingPayment(payment)}
                        aria-label={`Delete the payment from ${formatDate(payment.payment_date)}`}
                        className="rounded-md p-1.5 text-slate-500 opacity-0 transition hover:bg-red-100 hover:text-red-700 group-hover:opacity-100 group-focus-within:opacity-100"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Reminders"
        description="When to chase this loan."
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
          emptyTitle="No reminders on this loan"
          emptyDescription={
            loan.due_date
              ? 'The due date is recorded, but a reminder is what surfaces it.'
              : 'Add one to be told when a repayment is due.'
          }
        />
      </Card>

      <NotesSection
        subject={{ loan_id: loan.id }}
        description={`What was agreed with ${loan.display_name}.`}
      />

      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setReminderOpen(false)}
        subject={{ loan_id: loan.id }}
        subjectLabel={loan.display_name}
        defaultCurrency={loan.currency}
      />

      <LoanFormModal isOpen={isEditOpen} onClose={() => setEditOpen(false)} loan={loan} />
      <LoanPaymentModal isOpen={isPayOpen} onClose={() => setPayOpen(false)} loan={loan} />

      <ConfirmDialog
        isOpen={isSettleOpen}
        onClose={() => setSettleOpen(false)}
        onConfirm={async () => {
          await settleLoan.mutateAsync()
        }}
        title="Mark this loan as paid"
        description={`This records a ${formatMoney(loan.remaining, loan.currency)} payment dated today, so the history shows what closed the loan. Add the payment yourself instead if it ${isTaken ? 'was made' : 'arrived'} on a different date.`}
        confirmLabel="Mark as paid"
      />

      <ConfirmDialog
        isOpen={Boolean(deletingPayment)}
        onClose={() => setDeletingPayment(null)}
        onConfirm={async () => {
          if (deletingPayment) await deletePayment.mutateAsync(deletingPayment.id)
        }}
        title="Delete this payment"
        description={
          deletingPayment
            ? `Removing ${formatMoney(deletingPayment.amount, loan.currency)} puts that amount back on the loan, because the remaining amount is only ever the principal less these rows.`
            : ''
        }
        confirmLabel="Delete payment"
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteLoan.mutateAsync({ loanId: loan.id, permanent: true })
          navigate('/loans', { replace: true })
        }}
        title="Delete this loan"
        description={
          loan.payment_count > 0
            ? `This permanently deletes the loan and all ${loan.payment_count} of its payments. Write it off instead to keep the history.`
            : 'This permanently deletes the loan. Write it off instead to keep a record of it.'
        }
        confirmLabel="Delete permanently"
      />
    </div>
  )
}
