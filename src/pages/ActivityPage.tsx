import { Activity as ActivityIcon } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ActivityFeed } from '@/features/settlements/ActivityFeed'
import { useActivity } from '@/features/settlements/queries'
import { cn } from '@/lib/utils'
import type { ActivityType } from '@/types/api'

const PAGE_SIZE = 20

const FILTERS: Array<{ value: ActivityType | 'all'; label: string }> = [
  { value: 'all', label: 'Everything' },
  { value: 'expense', label: 'Expenses' },
  { value: 'settlement', label: 'Payments' },
]

export function ActivityPage() {
  const [filter, setFilter] = useState<ActivityType | 'all'>('all')
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')
  const [offset, setOffset] = useState(0)

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useActivity({
    type: filter === 'all' ? undefined : filter,
    order,
    limit: PAGE_SIZE,
    offset,
  })

  const total = data?.total ?? 0
  const hasNext = offset + PAGE_SIZE < total
  const hasPrevious = offset > 0

  const changeFilter = (next: ActivityType | 'all') => {
    setFilter(next)
    setOffset(0)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Activity</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every expense and payment you are part of.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" className="flex rounded-lg bg-slate-100 p-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={filter === option.value}
              onClick={() => changeFilter(option.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                filter === option.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setOrder((current) => (current === 'desc' ? 'asc' : 'desc'))
            setOffset(0)
          }}
        >
          {order === 'desc' ? 'Newest first' : 'Oldest first'}
        </Button>
      </div>

      {isLoading ? (
        <CardSkeleton lines={6} />
      ) : isError ? (
        <ErrorState error={error} title="Could not load activity" onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <Card
          title={`${total} entr${total === 1 ? 'y' : 'ies'}`}
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
          <ActivityFeed items={data.items} />
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={ActivityIcon}
            title="Nothing here yet"
            description={
              filter === 'all'
                ? 'Expenses and payments will appear here as they happen.'
                : `No ${filter === 'expense' ? 'expenses' : 'payments'} yet.`
            }
          />
        </Card>
      )}
    </div>
  )
}
