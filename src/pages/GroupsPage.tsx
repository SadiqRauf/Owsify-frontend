import { ChevronRight, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { GroupFormModal } from '@/features/groups/GroupFormModal'
import { useGroups } from '@/features/groups/queries'

export function GroupsPage() {
  const { data: groups, isLoading, isError, error, refetch } = useGroups()
  const [isFormOpen, setFormOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Groups</h1>
          <p className="mt-1 text-sm text-slate-500">
            A group for each set of people you share costs with.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} leftIcon={<Plus className="size-4" />}>
          New group
        </Button>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </div>
      ) : isError ? (
        <ErrorState error={error} title="Could not load your groups" onRetry={() => refetch()} />
      ) : groups && groups.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                to={`/groups/${group.id}`}
                className="flex h-full items-center gap-4 rounded-card bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-shadow hover:shadow-md"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                  {group.emoji || '👥'}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-slate-900">{group.name}</p>
                    {group.my_role !== 'member' && (
                      <Badge tone="brand">{group.my_role}</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {group.member_count} member{group.member_count === 1 ? '' : 's'} ·{' '}
                    {group.currency}
                  </p>
                </div>

                <ChevronRight aria-hidden className="size-5 shrink-0 text-slate-300" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <EmptyState
            icon={Users}
            title="No groups yet"
            description="Create a group for a trip, a flat, or anything else you split regularly."
            action={
              <Button onClick={() => setFormOpen(true)} leftIcon={<Plus className="size-4" />}>
                Create your first group
              </Button>
            }
          />
        </Card>
      )}

      <GroupFormModal
        isOpen={isFormOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(group) => navigate(`/groups/${group.id}`)}
      />
    </div>
  )
}
