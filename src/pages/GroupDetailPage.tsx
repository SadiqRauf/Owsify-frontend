import {
  ArrowLeft,
  HandCoins,
  LogOut,
  Pencil,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAuth } from '@/features/auth/use-auth'
import { GroupSummaryCards } from '@/features/balances/BalanceCards'
import { DebtRow, MemberBalanceRow } from '@/features/balances/BalanceList'
import { useGroupBalances, useSimplifiedPlan } from '@/features/balances/queries'
import { ExpenseFormModal } from '@/features/expenses/ExpenseFormModal'
import { ExpenseList } from '@/features/expenses/ExpenseList'
import { useExpenses } from '@/features/expenses/queries'
import { AddMembersModal } from '@/features/groups/AddMembersModal'
import { GroupFormModal } from '@/features/groups/GroupFormModal'
import { useDeleteGroup, useGroup, useRemoveGroupMember } from '@/features/groups/queries'
import { ActivityFeed } from '@/features/settlements/ActivityFeed'
import { SettleUpModal } from '@/features/settlements/SettleUpModal'
import { useActivity } from '@/features/settlements/queries'
import { cn } from '@/lib/utils'
import type { GroupMember } from '@/types/api'

/** Real pairwise debts, with an optional simplified view alongside. */
function BalancePanel({ groupId, currentUserId }: { groupId: string; currentUserId?: string }) {
  const [showSimplified, setShowSimplified] = useState(false)

  const { data, isLoading } = useGroupBalances(groupId)
  const { data: plan } = useSimplifiedPlan(groupId, showSimplified)

  if (isLoading) return <CardSkeleton lines={3} />
  if (!data) return null

  const settled = data.debts.length === 0

  return (
    <Card
      title="Balances"
      description={
        settled ? 'Everyone is settled up.' : `${data.debts.length} outstanding in this group.`
      }
      action={
        !settled && (
          <Button
            size="sm"
            variant={showSimplified ? 'primary' : 'secondary'}
            onClick={() => setShowSimplified((current) => !current)}
            leftIcon={<Sparkles className="size-4" />}
          >
            {showSimplified ? 'Show real debts' : 'Simplify'}
          </Button>
        )
      }
    >
      {settled ? (
        <p className="py-2 text-sm text-slate-500">
          Nobody owes anybody anything right now.
        </p>
      ) : showSimplified && plan ? (
        <div className="space-y-3">
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
            {plan.transfer_count < plan.original_count
              ? `${plan.transfer_count} payment${plan.transfer_count === 1 ? '' : 's'} instead of ${plan.original_count}. `
              : 'Same number of payments, rerouted so everyone settles directly. '}
            Everyone ends up in exactly the same position, but some people pay someone
            they did not borrow from directly.
          </p>
          <ul className="divide-y divide-slate-100">
            {plan.transfers.map((debt, index) => (
              <DebtRow
                key={`${debt.debtor.id}-${debt.creditor.id}-${index}`}
                debt={debt}
                currentUserId={currentUserId}
              />
            ))}
          </ul>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.debts.map((debt, index) => (
            <DebtRow
              key={`${debt.debtor.id}-${debt.creditor.id}-${index}`}
              debt={debt}
              currentUserId={currentUserId}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: group, isLoading, isError, error, refetch } = useGroup(groupId)
  const { data: balances } = useGroupBalances(groupId)
  const { data: expensePage, isLoading: expensesLoading } = useExpenses({ groupId, limit: 50 })
  const { data: activity } = useActivity({ groupId, limit: 8 })

  const deleteGroup = useDeleteGroup()
  const removeMember = useRemoveGroupMember(groupId ?? '')

  const [isEditOpen, setEditOpen] = useState(false)
  const [isAddMembersOpen, setAddMembersOpen] = useState(false)
  const [isExpenseOpen, setExpenseOpen] = useState(false)
  const [isSettleOpen, setSettleOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const [isLeaveOpen, setLeaveOpen] = useState(false)
  const [pendingRemoval, setPendingRemoval] = useState<GroupMember | null>(null)

  if (isLoading) return <CardSkeleton lines={6} />
  if (isError || !group) {
    return <ErrorState error={error} title="Could not load this group" onRetry={() => refetch()} />
  }

  const canManage = group.my_role === 'owner' || group.my_role === 'admin'
  const isOwner = group.my_role === 'owner'
  const members = group.members.map((member) => member.user)

  return (
    <div className="space-y-6">
      <Link
        to="/groups"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All groups
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
            {group.emoji || '👥'}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
              {group.name}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {group.member_count} member{group.member_count === 1 ? '' : 's'} · {group.currency}
            </p>
            {group.description && (
              <p className="mt-1 text-sm text-slate-600">{group.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setExpenseOpen(true)} leftIcon={<Plus className="size-4" />}>
            Add expense
          </Button>
          <Button
            variant="secondary"
            onClick={() => setSettleOpen(true)}
            leftIcon={<HandCoins className="size-4" />}
            disabled={group.member_count < 2}
          >
            Settle up
          </Button>
          {canManage && (
            <Button
              variant="secondary"
              onClick={() => setEditOpen(true)}
              leftIcon={<Pencil className="size-4" />}
            >
              Edit
            </Button>
          )}
        </div>
      </header>

      {balances && (
        <GroupSummaryCards
          totalExpenses={balances.total_expenses}
          totalSettled={balances.total_settled}
          yourNet={balances.your_net}
          currency={balances.currency}
        />
      )}

      <BalancePanel groupId={group.id} currentUserId={user?.id} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Members"
          description="Net position inside this group."
          action={
            canManage && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAddMembersOpen(true)}
                leftIcon={<UserPlus className="size-4" />}
              >
                Add
              </Button>
            )
          }
        >
          {balances && (
            <ul className="divide-y divide-slate-100">
              {balances.members.map((entry) => (
                <MemberBalanceRow key={entry.user.id} entry={entry} currentUserId={user?.id} />
              ))}
            </ul>
          )}

          {canManage && (
            <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">
              {group.members
                .filter(
                  (member) => member.role !== 'owner' && member.user.id !== user?.id,
                )
                .map((member) => (
                  <div key={member.id} className="flex items-center gap-2 py-1">
                    <Avatar name={member.user.full_name} src={member.user.avatar_url} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                      {member.user.full_name}
                    </span>
                    {member.role !== 'member' && <Badge tone="brand">{member.role}</Badge>}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingRemoval(member)}
                      aria-label={`Remove ${member.user.full_name}`}
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card title="Recent activity" description="Expenses and payments in this group.">
          {activity && activity.items.length > 0 ? (
            <ActivityFeed items={activity.items} />
          ) : (
            <p className="py-4 text-sm text-slate-500">Nothing has happened here yet.</p>
          )}
        </Card>
      </div>

      <Card title="Expenses" description={`${expensePage?.total ?? 0} in this group.`}>
        {expensesLoading ? (
          <div className="space-y-2 py-2">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        ) : expensePage && expensePage.items.length > 0 ? (
          <ExpenseList expenses={expensePage.items} />
        ) : (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Add the first one and everyone's share is worked out for you."
            action={
              <Button onClick={() => setExpenseOpen(true)} leftIcon={<Plus className="size-4" />}>
                Add expense
              </Button>
            }
          />
        )}
      </Card>

      <div className={cn('flex flex-wrap gap-2')}>
        {!isOwner && (
          <Button
            variant="secondary"
            onClick={() => setLeaveOpen(true)}
            leftIcon={<LogOut className="size-4" />}
          >
            Leave group
          </Button>
        )}
        {isOwner && (
          <Button
            variant="ghost"
            onClick={() => setDeleteOpen(true)}
            leftIcon={<Trash2 className="size-4" />}
            className="text-red-600 hover:bg-red-50"
          >
            Delete group
          </Button>
        )}
      </div>

      <GroupFormModal isOpen={isEditOpen} onClose={() => setEditOpen(false)} group={group} />

      <AddMembersModal
        isOpen={isAddMembersOpen}
        onClose={() => setAddMembersOpen(false)}
        group={group}
      />

      <ExpenseFormModal
        isOpen={isExpenseOpen}
        onClose={() => setExpenseOpen(false)}
        candidates={members}
        groupId={group.id}
        currency={group.currency}
      />

      <SettleUpModal
        isOpen={isSettleOpen}
        onClose={() => setSettleOpen(false)}
        candidates={members}
        groupId={group.id}
        currency={group.currency}
      />

      <ConfirmDialog
        isOpen={pendingRemoval !== null}
        onClose={() => setPendingRemoval(null)}
        onConfirm={() => removeMember.mutateAsync(pendingRemoval!.user.id)}
        title="Remove member"
        description={`Remove ${pendingRemoval?.user.full_name} from ${group.name}? People who appear in this group's expenses cannot be removed.`}
        confirmLabel="Remove"
      />

      <ConfirmDialog
        isOpen={isLeaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={async () => {
          await removeMember.mutateAsync(user!.id)
          navigate('/groups', { replace: true })
        }}
        title="Leave group"
        description={`Leave ${group.name}? You will lose access to its expenses.`}
        confirmLabel="Leave"
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteGroup.mutateAsync(group.id)
          navigate('/groups', { replace: true })
        }}
        title="Delete group"
        description={`Delete ${group.name} and all ${expensePage?.total ?? 0} of its expenses? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
