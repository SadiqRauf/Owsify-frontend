import { HandCoins, Plus, Receipt, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/use-auth'
import { BalanceCards } from '@/features/balances/BalanceCards'
import { PersonBalanceRow } from '@/features/balances/BalanceList'
import { useBalanceOverview } from '@/features/balances/queries'
import { useFriends } from '@/features/friends/queries'
import { ActivityFeed } from '@/features/settlements/ActivityFeed'
import { SettleUpModal } from '@/features/settlements/SettleUpModal'
import { useActivity } from '@/features/settlements/queries'
import type { PersonBalance } from '@/types/api'

export function DashboardPage() {
  const { user } = useAuth()

  const { data: balances, isLoading, isError, error, refetch } = useBalanceOverview()
  const { data: activity, isLoading: activityLoading } = useActivity({ limit: 6 })
  const { data: friends } = useFriends()

  const [settleWith, setSettleWith] = useState<PersonBalance | null>(null)
  const [isSettleOpen, setSettleOpen] = useState(false)

  const firstName = (user?.full_name ?? '').split(' ')[0]

  const openSettle = (entry: PersonBalance) => {
    setSettleWith(entry)
    setSettleOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-3">
          <CardSkeleton lines={1} />
          <CardSkeleton lines={1} />
          <CardSkeleton lines={1} />
        </div>
        <CardSkeleton lines={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState error={error} title="Could not load your dashboard" onRetry={() => refetch()} />
    )
  }

  const people = balances?.people ?? []

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {firstName ? `Hi, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here is where your shared money stands.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setSettleWith(null)
              setSettleOpen(true)
            }}
            leftIcon={<HandCoins className="size-4" />}
            disabled={(friends?.length ?? 0) === 0}
            title={(friends?.length ?? 0) === 0 ? 'Add a friend first' : undefined}
          >
            Settle up
          </Button>
          <Link
            to="/expenses"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Plus aria-hidden className="size-4" />
            Add expense
          </Link>
        </div>
      </header>

      <BalanceCards totals={balances?.totals ?? []} />

      {people.length > 0 && (
        <Card title="Who owes whom" description="Across every group and friend.">
          <ul className="divide-y divide-slate-100">
            {people.map((entry) => (
              <PersonBalanceRow
                key={`${entry.user.id}-${entry.currency}`}
                entry={entry}
                onSettle={openSettle}
              />
            ))}
          </ul>
        </Card>
      )}

      <Card
        title="Recent activity"
        action={
          activity && activity.items.length > 0 ? (
            <Link to="/activity" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              View all
            </Link>
          ) : undefined
        }
      >
        {activityLoading ? (
          <div className="space-y-2 py-2">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        ) : activity && activity.items.length > 0 ? (
          <ActivityFeed items={activity.items} />
        ) : (
          <EmptyState
            icon={Receipt}
            title="No activity yet"
            description="Create a group or add a friend, then log your first shared expense."
            action={
              <div className="flex gap-2">
                <Link
                  to="/groups"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
                >
                  <Users aria-hidden className="size-4" />
                  New group
                </Link>
                <Link
                  to="/friends"
                  className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  Add a friend
                </Link>
              </div>
            }
          />
        )}
      </Card>

      <SettleUpModal
        isOpen={isSettleOpen}
        onClose={() => setSettleOpen(false)}
        candidates={[
          ...(user ? [user] : []),
          ...(friends?.map((friend) => friend.user) ?? []),
        ]}
        currency={settleWith?.currency ?? user?.currency ?? 'USD'}
        defaultCounterpartyId={settleWith?.user.id}
      />
    </div>
  )
}
