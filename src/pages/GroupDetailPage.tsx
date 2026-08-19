import { ArrowLeft, LogOut, Pencil, Plus, Receipt, Trash2, UserMinus, UserPlus } from 'lucide-react'
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
import { ExpenseFormModal } from '@/features/expenses/ExpenseFormModal'
import { ExpenseList } from '@/features/expenses/ExpenseList'
import { useBalances, useExpenses } from '@/features/expenses/queries'
import { AddMembersModal } from '@/features/groups/AddMembersModal'
import { GroupFormModal } from '@/features/groups/GroupFormModal'
import { useDeleteGroup, useGroup, useRemoveGroupMember } from '@/features/groups/queries'
import { formatAbsMoney, toCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { GroupMember } from '@/types/api'

function BalancePanel({ groupId, currency }: { groupId: string; currency: string }) {
  const { data, isLoading } = useBalances(groupId)

  if (isLoading) return <CardSkeleton lines={2} />
  if (!data || data.entries.length === 0) {
    return (
      <Card title="Balances">
        <p className="py-2 text-sm text-slate-500">Everyone is settled up in this group.</p>
      </Card>
    )
  }

  return (
    <Card title="Balances" description="From this group's expenses.">
      <ul className="divide-y divide-slate-100">
        {data.entries.map((entry) => {
          const amount = toCents(entry.amount)
          return (
            <li key={entry.user.id} className="flex items-center gap-3 py-2.5">
              <Avatar name={entry.user.full_name} src={entry.user.avatar_url} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {amount > 0
                  ? `${entry.user.full_name} owes you`
                  : `You owe ${entry.user.full_name}`}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  amount > 0 ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                {formatAbsMoney(entry.amount, currency)}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: group, isLoading, isError, error, refetch } = useGroup(groupId)
  const { data: expensePage, isLoading: expensesLoading } = useExpenses({ groupId, limit: 50 })

  const deleteGroup = useDeleteGroup()
  const removeMember = useRemoveGroupMember(groupId ?? '')

  const [isEditOpen, setEditOpen] = useState(false)
  const [isAddMembersOpen, setAddMembersOpen] = useState(false)
  const [isExpenseOpen, setExpenseOpen] = useState(false)
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

      <BalancePanel groupId={group.id} currency={group.currency} />

      <Card
        title="Members"
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
        <ul className="divide-y divide-slate-100">
          {group.members.map((member) => (
            <li key={member.id} className="flex items-center gap-3 py-3">
              <Avatar name={member.user.full_name} src={member.user.avatar_url} size="sm" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {member.user.id === user?.id ? 'You' : member.user.full_name}
                </p>
                <p className="truncate text-xs text-slate-500">{member.user.email}</p>
              </div>

              {member.role !== 'member' && <Badge tone="brand">{member.role}</Badge>}

              {canManage && member.role !== 'owner' && member.user.id !== user?.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPendingRemoval(member)}
                  aria-label={`Remove ${member.user.full_name}`}
                >
                  <UserMinus className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

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

      {/* Danger zone */}
      <div className="flex flex-wrap gap-2">
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
