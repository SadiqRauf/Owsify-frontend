import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { useFriends } from '@/features/friends/queries'
import { getErrorMessage, isApiError } from '@/lib/api-client'
import type { GroupDetail } from '@/types/api'

import { useCreateGroup, useUpdateGroup } from './queries'
import { groupSchema, type GroupValues } from './schemas'

interface GroupFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** Omit to create; pass a group to edit it. */
  group?: GroupDetail
  onCreated?: (group: GroupDetail) => void
}

export function GroupFormModal({ isOpen, onClose, group, onCreated }: GroupFormModalProps) {
  const isEditing = Boolean(group)
  const { data: friends } = useFriends()

  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup(group?.id ?? '')

  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GroupValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group?.name ?? '',
      description: group?.description ?? '',
      currency: group?.currency ?? 'USD',
      emoji: group?.emoji ?? '',
    },
  })

  const close = () => {
    setFormError(null)
    setSelectedFriends([])
    reset()
    onClose()
  }

  const toggleFriend = (userId: string) => {
    setSelectedFriends((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const payload = {
      name: values.name,
      description: values.description || null,
      currency: values.currency,
      emoji: values.emoji || null,
    }

    try {
      if (isEditing) {
        await updateGroup.mutateAsync(payload)
      } else {
        const created = await createGroup.mutateAsync({
          ...payload,
          member_ids: selectedFriends,
        })
        onCreated?.(created)
      }
      close()
    } catch (error) {
      if (isApiError(error)) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          setError(field as keyof GroupValues, { message })
        }
      }
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={isEditing ? 'Edit group' : 'New group'}
      description={
        isEditing ? 'Update the name, description, or currency.' : 'Name it and pick who is in it.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Create group'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <div className="flex gap-3">
          <div className="w-20 shrink-0">
            <Input
              label="Icon"
              placeholder="🏠"
              maxLength={8}
              error={errors.emoji?.message}
              {...register('emoji')}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Group name"
              placeholder="Ski trip"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>
        </div>

        <CurrencySelect
          hint="Every expense in this group is recorded in it."
          ensureCode={group?.currency}
          error={errors.currency?.message}
          {...register('currency')}
        />

        <Textarea
          label="Description"
          placeholder="Optional"
          error={errors.description?.message}
          {...register('description')}
        />

        {!isEditing && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Add friends</legend>

            {friends && friends.length > 0 ? (
              <ul className="max-h-52 space-y-1 overflow-y-auto rounded-lg ring-1 ring-slate-200 p-1">
                {friends.map((friend) => {
                  const isSelected = selectedFriends.includes(friend.user.id)
                  return (
                    <li key={friend.friendship_id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFriend(friend.user.id)}
                          className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <Avatar name={friend.user.full_name} src={friend.user.avatar_url} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                          {friend.user.full_name}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                You have no friends yet. Create the group now and add people to it later.
              </p>
            )}
          </fieldset>
        )}
      </form>
    </Modal>
  )
}
