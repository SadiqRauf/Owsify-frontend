import { HandCoins, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/features/auth/use-auth'
import { useFriends } from '@/features/friends/queries'
import { SettleUpModal } from '@/features/settlements/SettleUpModal'
import { useDeleteSettlement, useSettlements } from '@/features/settlements/queries'
import { formatAbsMoney } from '@/lib/money'
import { formatDate } from '@/lib/utils'
import type { PaymentMethod, Settlement } from '@/types/api'

const PAGE_SIZE = 20

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  card: 'Card',
  paypal: 'PayPal',
  venmo: 'Venmo',
  upi: 'UPI',
  other: 'Other',
}

const SORTS = [
  { value: '-settled_on', label: 'Newest first' },
  { value: 'settled_on', label: 'Oldest first' },
  { value: '-amount', label: 'Largest first' },
  { value: 'amount', label: 'Smallest first' },
]

export function SettlementsPage() {
  const { user } = useAuth()
  const { data: friends } = useFriends()

  const [sort, setSort] = useState('-settled_on')
  const [offset, setOffset] = useState(0)
  const [isSettleOpen, setSettleOpen] = useState(false)
  const [pendingDeletion, setPendingDeletion] = useState<Settlement | null>(null)

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useSettlements({
    sort,
    limit: PAGE_SIZE,
    offset,
  })
  const deleteSettlement = useDeleteSettlement()

  const total = data?.total ?? 0
  const hasNext = offset + PAGE_SIZE < total
  const hasPrevious = offset > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settle up</h1>
          <p className="mt-1 text-sm text-slate-500">
            Payments you have made or received.
          </p>
        </div>
        <Button
          onClick={() => setSettleOpen(true)}
          leftIcon={<HandCoins className="size-4" />}
          disabled={(friends?.length ?? 0) === 0}
          title={(friends?.length ?? 0) === 0 ? 'Add a friend first' : undefined}
        >
          Record a payment
        </Button>
      </header>

      {isLoading ? (
        <CardSkeleton lines={5} />
      ) : isError ? (
        <ErrorState error={error} title="Could not load settlements" onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <Card
          title={`${total} payment${total === 1 ? '' : 's'}`}
          action={
            <div className="flex items-end gap-2">
              <div className="w-44">
                <Select
                  label=""
                  options={SORTS}
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value)
                    setOffset(0)
                  }}
                />
              </div>
            </div>
          }
        >
          <ul className="divide-y divide-slate-100">
            {data.items.map((settlement) => {
              const youPaid = settlement.from_user.id === user?.id
              const other = youPaid ? settlement.to_user : settlement.from_user

              return (
                <li key={settlement.id} className="flex items-center gap-3 py-3">
                  <Avatar name={other.full_name} src={other.avatar_url} size="sm" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {youPaid
                        ? `You paid ${other.full_name}`
                        : `${other.full_name} paid you`}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {formatDate(settlement.settled_on)} · {METHOD_LABELS[settlement.method]}
                      {settlement.notes ? ` · ${settlement.notes}` : ''}
                    </p>
                  </div>

                  <Badge tone={youPaid ? 'warning' : 'success'}>
                    {youPaid ? 'sent' : 'received'}
                  </Badge>

                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {formatAbsMoney(settlement.amount, settlement.currency)}
                  </span>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingDeletion(settlement)}
                    aria-label="Delete settlement"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              )
            })}
          </ul>

          {(hasPrevious || hasNext) && (
            <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
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
          )}
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={HandCoins}
            title="No payments yet"
            description="When you pay someone back, record it here and the balances update."
            action={
              (friends?.length ?? 0) > 0 && (
                <Button onClick={() => setSettleOpen(true)} leftIcon={<HandCoins className="size-4" />}>
                  Record a payment
                </Button>
              )
            }
          />
        </Card>
      )}

      <SettleUpModal
        isOpen={isSettleOpen}
        onClose={() => setSettleOpen(false)}
        candidates={[
          ...(user ? [user] : []),
          ...(friends?.map((friend) => friend.user) ?? []),
        ]}
        currency={user?.currency ?? 'USD'}
      />

      <ConfirmDialog
        isOpen={pendingDeletion !== null}
        onClose={() => setPendingDeletion(null)}
        onConfirm={() =>
          deleteSettlement.mutateAsync({
            settlementId: pendingDeletion!.id,
            groupId: pendingDeletion!.group_id,
          })
        }
        title="Delete payment"
        description="Deleting this payment restores the debt it settled. Everyone's balance will move back."
        confirmLabel="Delete"
      />
    </div>
  )
}
