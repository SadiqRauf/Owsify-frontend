import { Bell, CheckCheck } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { NotificationList } from '@/features/notifications/NotificationList'
import {
  useMarkAllNotificationsRead,
  useNotifications,
} from '@/features/notifications/queries'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const FILTERS = [
  { value: false, label: 'All' },
  { value: true, label: 'Unread' },
] as const

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [offset, setOffset] = useState(0)

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useNotifications({
    unread_only: unreadOnly,
    limit: PAGE_SIZE,
    offset,
  })
  const markAll = useMarkAllNotificationsRead()

  const total = data?.total ?? 0
  const unread = data?.unread_count ?? 0
  const hasNext = offset + PAGE_SIZE < total
  const hasPrevious = offset > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            What other people did that affects you.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<CheckCheck aria-hidden className="size-4" />}
          disabled={unread === 0}
          isLoading={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Mark all read
        </Button>
      </header>

      <div role="tablist" className="flex w-fit rounded-lg bg-slate-100 p-1">
        {FILTERS.map((option) => (
          <button
            key={option.label}
            type="button"
            role="tab"
            aria-selected={unreadOnly === option.value}
            onClick={() => {
              setUnreadOnly(option.value)
              setOffset(0)
            }}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              unreadOnly === option.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {option.label}
            {option.value && unread > 0 && ` (${unread})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <CardSkeleton lines={6} />
      ) : isError ? (
        <ErrorState error={error} title="Could not load notifications" onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <Card
          className="p-0 sm:p-0"
          action={
            (hasPrevious || hasNext) && (
              <div className="flex gap-2 px-5 pt-4">
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
          <NotificationList items={data.items} className="overflow-hidden rounded-card" />
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={Bell}
            title={unreadOnly ? 'You are all caught up' : 'No notifications yet'}
            description={
              unreadOnly
                ? 'Nothing new since you last looked.'
                : 'When a friend adds an expense, pays you, or adds you to a group, you will hear about it here.'
            }
          />
        </Card>
      )}
    </div>
  )
}
