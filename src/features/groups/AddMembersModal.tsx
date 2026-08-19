import { useMemo, useState } from 'react'

import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useFriends } from '@/features/friends/queries'
import { getErrorMessage } from '@/lib/api-client'
import type { GroupDetail } from '@/types/api'

import { useAddGroupMembers } from './queries'

interface AddMembersModalProps {
  isOpen: boolean
  onClose: () => void
  group: GroupDetail
}

export function AddMembersModal({ isOpen, onClose, group }: AddMembersModalProps) {
  const { data: friends } = useFriends()
  const addMembers = useAddGroupMembers(group.id)

  const [selected, setSelected] = useState<string[]>([])
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const existingIds = useMemo(
    () => new Set(group.members.map((member) => member.user.id)),
    [group.members],
  )
  const available = (friends ?? []).filter((friend) => !existingIds.has(friend.user.id))

  const close = () => {
    setSelected([])
    setEmail('')
    setError(null)
    onClose()
  }

  const handleAdd = async () => {
    setError(null)
    const trimmedEmail = email.trim()

    if (selected.length === 0 && !trimmedEmail) {
      setError('Pick at least one friend, or enter an email address.')
      return
    }

    try {
      await addMembers.mutateAsync({
        user_ids: selected,
        emails: trimmedEmail ? [trimmedEmail] : [],
      })
      close()
    } catch (caught) {
      setError(getErrorMessage(caught))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Add members"
      description={`Bring more people into ${group.name}.`}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={addMembers.isPending}>
            Cancel
          </Button>
          <Button onClick={handleAdd} isLoading={addMembers.isPending}>
            Add
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        {available.length > 0 ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Your friends</legend>
            <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg p-1 ring-1 ring-slate-200">
              {available.map((friend) => (
                <li key={friend.friendship_id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selected.includes(friend.user.id)}
                      onChange={() =>
                        setSelected((current) =>
                          current.includes(friend.user.id)
                            ? current.filter((id) => id !== friend.user.id)
                            : [...current, friend.user.id],
                        )
                      }
                      className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <Avatar name={friend.user.full_name} src={friend.user.avatar_url} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                      {friend.user.full_name}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : (
          <p className="text-sm text-slate-500">
            All of your friends are already in this group.
          </p>
        )}

        <Input
          label="Or add by email"
          type="email"
          placeholder="them@example.com"
          hint="They need an account already."
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
    </Modal>
  )
}
