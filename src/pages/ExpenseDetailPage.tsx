import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAuth } from '@/features/auth/use-auth'
import { ExpenseFormModal } from '@/features/expenses/ExpenseFormModal'
import { useDeleteExpense, useExpense } from '@/features/expenses/queries'
import { useGroup } from '@/features/groups/queries'
import { formatAbsMoney, formatMoney, isZero, toCents } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'

const SPLIT_LABEL = {
  equal: 'Split equally',
  exact: 'Split by exact amounts',
  percentage: 'Split by percentage',
} as const

export function ExpenseDetailPage() {
  const { expenseId } = useParams<{ expenseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: expense, isLoading, isError, error, refetch } = useExpense(expenseId)
  const { data: group } = useGroup(expense?.group_id ?? undefined)
  const deleteExpense = useDeleteExpense()

  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) return <CardSkeleton lines={6} />
  if (isError || !expense) {
    return (
      <ErrorState error={error} title="Could not load this expense" onRetry={() => refetch()} />
    )
  }

  const net = toCents(expense.my_net)
  const canEdit = expense.created_by.id === user?.id || expense.paid_by.id === user?.id
  const candidates = group
    ? group.members.map((member) => member.user)
    : expense.splits.map((split) => split.user)

  const backTo = expense.group_id ? `/groups/${expense.group_id}` : '/expenses'

  return (
    <div className="space-y-6">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {group ? group.name : 'All expenses'}
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              {expense.description}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(expense.expense_date)} · {expense.category}
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums text-slate-900">
              {formatMoney(expense.amount, expense.currency)}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              {expense.paid_by.id === user?.id ? 'You' : expense.paid_by.full_name} paid
            </p>
          </div>
        </div>

        {!isZero(expense.my_net) && (
          <div
            className={cn(
              'mt-4 rounded-lg px-3 py-2 text-sm font-medium',
              net > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800',
            )}
          >
            {net > 0
              ? `You are owed ${formatAbsMoney(expense.my_net, expense.currency)} on this expense.`
              : `You owe ${formatAbsMoney(expense.my_net, expense.currency)} on this expense.`}
          </div>
        )}

        {expense.notes && (
          <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            {expense.notes}
          </p>
        )}

        {canEdit && (
          <div className="mt-5 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditOpen(true)}
              leftIcon={<Pencil className="size-4" />}
            >
              Edit
            </Button>
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
        )}
      </Card>

      <Card title="Split" description={SPLIT_LABEL[expense.split_type]}>
        <ul className="divide-y divide-slate-100">
          {expense.splits.map((split) => (
            <li key={split.user.id} className="flex items-center gap-3 py-3">
              <Avatar name={split.user.full_name} src={split.user.avatar_url} size="sm" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-900">
                  {split.user.id === user?.id ? 'You' : split.user.full_name}
                </p>
                {split.user.id === expense.paid_by.id && (
                  <Badge tone="brand" className="mt-0.5">
                    paid
                  </Badge>
                )}
              </div>

              {split.percentage && (
                <span className="text-xs tabular-nums text-slate-400">
                  {Number(split.percentage)}%
                </span>
              )}
              <span className="text-sm font-medium tabular-nums text-slate-900">
                {formatMoney(split.amount, expense.currency)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-slate-400">
          Added by {expense.created_by.id === user?.id ? 'you' : expense.created_by.full_name} on{' '}
          {formatDate(expense.created_at)}
        </p>
      </Card>

      <ExpenseFormModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        candidates={candidates}
        groupId={expense.group_id}
        currency={expense.currency}
        expense={expense}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteExpense.mutateAsync({
            expenseId: expense.id,
            groupId: expense.group_id,
          })
          navigate(backTo, { replace: true })
        }}
        title="Delete expense"
        description={`Delete “${expense.description}”? This removes it from everyone's balances.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
