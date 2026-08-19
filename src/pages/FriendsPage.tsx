import { Check, Mail, RefreshCw, UserMinus, UserPlus, Users, X } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { UserSearch } from '@/features/friends/UserSearch'
import {
  useAcceptFriendRequest,
  useCancelFriendRequest,
  useCancelInvitation,
  useFriendRequests,
  useFriends,
  useInvitations,
  useRejectFriendRequest,
  useRemoveFriend,
  useResendInvitation,
} from '@/features/friends/queries'
import { formatDate } from '@/lib/utils'
import type { FriendSummary } from '@/types/api'

function IncomingRequests() {
  const { data, isLoading } = useFriendRequests('incoming')
  const accept = useAcceptFriendRequest()
  const reject = useRejectFriendRequest()

  if (isLoading || !data || data.length === 0) return null

  return (
    <Card
      title="Friend requests"
      description={`${data.length} person${data.length === 1 ? '' : 's'} wants to connect.`}
    >
      <ul className="divide-y divide-slate-100">
        {data.map((request) => (
          <li key={request.id} className="flex items-center gap-3 py-3">
            <Avatar name={request.user.full_name} src={request.user.avatar_url} size="sm" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {request.user.full_name}
              </p>
              <p className="truncate text-xs text-slate-500">{request.user.email}</p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                isLoading={accept.isPending && accept.variables === request.id}
                onClick={() => accept.mutate(request.id)}
                leftIcon={<Check className="size-4" />}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="secondary"
                isLoading={reject.isPending && reject.variables === request.id}
                onClick={() => reject.mutate(request.id)}
                leftIcon={<X className="size-4" />}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function OutgoingRequests() {
  const { data, isLoading } = useFriendRequests('outgoing')
  const cancel = useCancelFriendRequest()

  if (isLoading || !data || data.length === 0) return null

  return (
    <Card title="Sent requests" description="Waiting for them to respond.">
      <ul className="divide-y divide-slate-100">
        {data.map((request) => (
          <li key={request.id} className="flex items-center gap-3 py-3">
            <Avatar name={request.user.full_name} src={request.user.avatar_url} size="sm" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {request.user.full_name}
              </p>
              <p className="truncate text-xs text-slate-500">
                Sent {formatDate(request.created_at)}
              </p>
            </div>

            <Badge>Pending</Badge>
            <Button
              size="sm"
              variant="ghost"
              isLoading={cancel.isPending && cancel.variables === request.id}
              onClick={() => cancel.mutate(request.id)}
            >
              Withdraw
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function SentInvitations() {
  const { data, isLoading } = useInvitations()
  const resend = useResendInvitation()
  const cancel = useCancelInvitation()

  // Accepted invitations already show up as friends, so only the open ones matter.
  const open = (data ?? []).filter((invitation) => invitation.status === 'pending')

  if (isLoading || open.length === 0) return null

  return (
    <Card
      title="Invitations"
      description="People you invited who have not signed up yet."
    >
      <ul className="divide-y divide-slate-100">
        {open.map((invitation) => (
          <li key={invitation.id} className="flex items-center gap-3 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Mail aria-hidden className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{invitation.email}</p>
              <p className="truncate text-xs text-slate-500">
                {invitation.is_expired
                  ? `Expired ${formatDate(invitation.expires_at)}`
                  : `Invited ${formatDate(invitation.created_at)} · expires ${formatDate(invitation.expires_at)}`}
              </p>
            </div>

            <Badge tone={invitation.is_expired ? 'warning' : 'neutral'}>
              {invitation.is_expired ? 'Expired' : 'Invited'}
            </Badge>

            <Button
              size="sm"
              variant="ghost"
              isLoading={resend.isPending && resend.variables === invitation.id}
              onClick={() => resend.mutate(invitation.id)}
              leftIcon={<RefreshCw className="size-4" />}
            >
              Resend
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isLoading={cancel.isPending && cancel.variables === invitation.id}
              onClick={() => cancel.mutate(invitation.id)}
            >
              Cancel
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function FriendsPage() {
  const { data: friends, isLoading, isError, error, refetch } = useFriends()
  const removeFriend = useRemoveFriend()

  const [isSearchOpen, setSearchOpen] = useState(false)
  const [pendingRemoval, setPendingRemoval] = useState<FriendSummary | null>(null)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Friends</h1>
          <p className="mt-1 text-sm text-slate-500">
            People you can split expenses with outside a group.
          </p>
        </div>
        <Button onClick={() => setSearchOpen(true)} leftIcon={<UserPlus className="size-4" />}>
          Add friend
        </Button>
      </header>

      <IncomingRequests />
      <OutgoingRequests />
      <SentInvitations />

      {isLoading ? (
        <CardSkeleton lines={4} />
      ) : isError ? (
        <ErrorState error={error} title="Could not load your friends" onRetry={() => refetch()} />
      ) : friends && friends.length > 0 ? (
        <Card title="Your friends" description={`${friends.length} connected.`}>
          <ul className="divide-y divide-slate-100">
            {friends.map((friend) => (
              <li key={friend.friendship_id} className="flex items-center gap-3 py-3">
                <Avatar name={friend.user.full_name} src={friend.user.avatar_url} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {friend.user.full_name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{friend.user.email}</p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPendingRemoval(friend)}
                  leftIcon={<UserMinus className="size-4" />}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={Users}
            title="No friends yet"
            description="Search for people by name or email — or invite them by email if they are not here yet."
            action={
              <Button onClick={() => setSearchOpen(true)} leftIcon={<UserPlus className="size-4" />}>
                Find people
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        isOpen={isSearchOpen}
        onClose={() => setSearchOpen(false)}
        title="Add a friend"
        description="Search by name or email. Not on Splitwise? Invite them."
      >
        <UserSearch />
      </Modal>

      <ConfirmDialog
        isOpen={pendingRemoval !== null}
        onClose={() => setPendingRemoval(null)}
        onConfirm={() => removeFriend.mutateAsync(pendingRemoval!.user.id)}
        title="Remove friend"
        description={`Remove ${pendingRemoval?.user.full_name} from your friends? Any shared expenses stay where they are.`}
        confirmLabel="Remove"
      />
    </div>
  )
}
