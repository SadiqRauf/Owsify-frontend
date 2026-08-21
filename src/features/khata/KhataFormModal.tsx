import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useFriends } from '@/features/friends/queries'
import { getErrorMessage, isApiError } from '@/lib/api-client'
import type { Khata } from '@/types/api'

import { useCreateKhata, useUpdateKhata } from './queries'

const khataSchema = z.object({
  person_name: z
    .string()
    .trim()
    .min(1, 'Whose khata is this?')
    .max(120, 'Name must be at most 120 characters.'),
  // Optional, and validated only when filled: requiring an email would defeat the
  // point, which is keeping a book for someone with no account at all.
  person_phone: z.string().trim().max(32, 'Phone number is too long.').optional(),
  person_email: z.union([z.literal(''), z.email('Enter a valid email address.')]).optional(),
  person_user_id: z.string().optional(),
  currency: z.string().trim().length(3),
  notes: z.string().trim().max(2000, 'Notes are too long.').optional(),
})

type KhataValues = z.infer<typeof khataSchema>

interface KhataFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** Omit to open a new khata; pass one to edit it. */
  khata?: Khata
  onCreated?: (khata: Khata) => void
}

export function KhataFormModal({ isOpen, onClose, khata, onCreated }: KhataFormModalProps) {
  const isEditing = Boolean(khata)
  const { data: friends } = useFriends()

  const createKhata = useCreateKhata()
  const updateKhata = useUpdateKhata(khata?.id ?? '')

  const [formError, setFormError] = useState<string | null>(null)

  const defaults: KhataValues = {
    person_name: khata?.person_name ?? '',
    person_phone: khata?.person_phone ?? '',
    person_email: khata?.person_email ?? '',
    person_user_id: khata?.person_user?.id ?? '',
    currency: khata?.currency ?? 'PKR',
    notes: khata?.notes ?? '',
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<KhataValues>({ resolver: zodResolver(khataSchema), defaultValues: defaults })

  useEffect(() => {
    if (isOpen) reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, khata?.id, reset])

  const close = () => {
    setFormError(null)
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    const payload = {
      person_name: values.person_name,
      person_phone: values.person_phone?.trim() || null,
      person_email: values.person_email?.trim() || null,
      person_user_id: values.person_user_id || null,
      currency: values.currency,
      notes: values.notes?.trim() || null,
    }

    try {
      if (isEditing) {
        await updateKhata.mutateAsync(payload)
      } else {
        const created = await createKhata.mutateAsync(payload)
        onCreated?.(created)
      }
      close()
    } catch (error) {
      if (isApiError(error)) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          setError(field as keyof KhataValues, { message })
        }
      }
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={isEditing ? 'Edit khata' : 'Add khata'}
      description={
        isEditing
          ? 'Update the details of this khata.'
          : 'A name is all you need — they do not have to be on Owsify.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add khata'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Name"
          placeholder="Ahmed"
          autoComplete="off"
          error={errors.person_name?.message}
          {...register('person_name')}
        />

        {/* Linking is optional and secondary — offered after the name, not before,
            so the common case is not gated behind finding an account. */}
        {friends && friends.length > 0 && (
          <Select
            label="Link an Owsify account (optional)"
            hint="Links the khata to their account, so their name stays up to date."
            options={[
              { value: '', label: 'Not linked' },
              ...friends.map((friend) => ({
                value: friend.user.id,
                label: friend.user.full_name,
              })),
            ]}
            error={errors.person_user_id?.message}
            {...register('person_user_id')}
            onChange={(event) => {
              const chosen = friends.find((f) => f.user.id === event.target.value)
              setValue('person_user_id', event.target.value)
              // Prefill the name from the account, but leave it editable: the name
              // on a khata is the owner's own label for that person.
              if (chosen) setValue('person_name', chosen.user.full_name)
            }}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone (optional)"
            placeholder="0300-1234567"
            inputMode="tel"
            error={errors.person_phone?.message}
            {...register('person_phone')}
          />
          <CurrencySelect
            ensureCode={khata?.currency ?? 'PKR'}
            error={errors.currency?.message}
            {...register('currency')}
          />
        </div>

        <Input
          label="Email (optional)"
          type="email"
          placeholder="ahmed@example.com"
          error={errors.person_email?.message}
          {...register('person_email')}
        />

        <Textarea
          label="Notes (optional)"
          placeholder="Corner shop, pays weekly"
          rows={2}
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  )
}
