import { Plus, Receipt } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/use-auth'
import { ExpenseFormModal } from '@/features/expenses/ExpenseFormModal'
import { ExpenseList } from '@/features/expenses/ExpenseList'
import { useExpenses } from '@/features/expenses/queries'
import { useFriends } from '@/features/friends/queries'

const PAGE_SIZE = 20

export function ExpensesPage() {
  const { user } = useAuth()
  const [offset, setOffset] = useState(0)
  const [isFormOpen, setFormOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useExpenses({
    offset,
    limit: PAGE_SIZE,
  })
  const { data: friends } = useFriends()

  // A personal expense can only involve you and your friends.
  const candidates = [
    ...(user ? [user] : []),
    ...(friends?.map((friend) => friend.user) ?? []),
  ]

  const total = data?.total ?? 0
  const hasNext = offset + PAGE_SIZE < total
  const hasPrevious = offset > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Expenses</h1>
          <p className="mt-1 text-sm text-slate-500">
            Everything you are part of, newest first.
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          leftIcon={<Plus className="size-4" />}
          disabled={candidates.length < 2}
          title={candidates.length < 2 ? 'Add a friend first' : undefined}
        >
          Add expense
        </Button>
      </header>

      {isLoading ? (
        <CardSkeleton lines={5} />
      ) : isError ? (
        <ErrorState error={error} title="Could not load expenses" onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <Card
          title={`${total} expense${total === 1 ? '' : 's'}`}
          action={
            (hasPrevious || hasNext) && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!hasPrevious || isPlaceholderData}
                  onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!hasNext || isPlaceholderData}
                  onClick={() => setOffset((current) => current + PAGE_SIZE)}
                >
                  Next
                </Button>
              </div>
            )
          }
        >
          <ExpenseList expenses={data.items} />
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description={
              candidates.length < 2
                ? 'Add a friend or create a group, then log your first shared expense.'
                : 'Log your first shared expense to see it here.'
            }
            action={
              candidates.length >= 2 && (
                <Button onClick={() => setFormOpen(true)} leftIcon={<Plus className="size-4" />}>
                  Add expense
                </Button>
              )
            }
          />
        </Card>
      )}

      <ExpenseFormModal
        isOpen={isFormOpen}
        onClose={() => setFormOpen(false)}
        candidates={candidates}
        currency={user?.currency ?? 'USD'}
      />
    </div>
  )
}
