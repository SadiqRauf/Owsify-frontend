import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { getErrorMessage, isApiError } from '@/lib/api-client'
import { cn, todayIso } from '@/lib/utils'
import type { KhataEntry, KhataEntryType } from '@/types/api'

import { useCreateKhataEntry, useUpdateKhataEntry } from './queries'

const entrySchema = z
  .object({
    entry_type: z.enum(['given', 'received', 'adjustment']),
    amount: z
      .string()
      .trim()
      .min(1, 'Enter an amount.')
      .refine((value) => /^-?\d*\.?\d{0,2}$/.test(value), 'Use a number, up to two decimals.')
      .refine((value) => Number(value) !== 0, 'An entry needs a non-zero amount.'),
    entry_date: z.string().min(1, 'Pick a date.'),
    description: z.string().trim().max(200, 'Keep the note under 200 characters.').optional(),
  })
  // The same rule the database enforces, checked here so the message arrives before
  // the round trip rather than as a 422 the user has to interpret.
  .refine(
    (values) => values.entry_type === 'adjustment' || Number(values.amount) > 0,
    {
      path: ['amount'],
      message: 'Given and Received carry their own direction — keep the amount positive.',
    },
  )
  .refine((values) => values.entry_date <= todayIso(), {
    path: ['entry_date'],
    message: 'An entry cannot be dated in the future.',
  })

type EntryValues = z.infer<typeof entrySchema>

/**
 * The three types, described from the owner's side of the counter.
 *
 * The wording matters more than it looks: "given" and "received" are unambiguous
 * where "debit" and "credit" invert depending on whose book you think you are in.
 */
const TYPES: { value: KhataEntryType; label: string; hint: string; tone: string }[] = [
  {
    value: 'given',
    label: 'Given',
    hint: 'They owe you more',
    tone: 'data-[on=true]:border-emerald-500 data-[on=true]:bg-emerald-50 data-[on=true]:text-emerald-700',
  },
  {
    value: 'received',
    label: 'Received',
    hint: 'They owe you less',
    tone: 'data-[on=true]:border-sky-500 data-[on=true]:bg-sky-50 data-[on=true]:text-sky-700',
  },
  {
    value: 'adjustment',
    label: 'Adjustment',
    hint: 'A correction, either way',
    tone: 'data-[on=true]:border-amber-500 data-[on=true]:bg-amber-50 data-[on=true]:text-amber-700',
  },
]

interface KhataEntryModalProps {
  isOpen: boolean
  onClose: () => void
  khataId: string
  currency: string
  /** Omit to add an entry; pass one to edit it. */
  entry?: KhataEntry
}

export function KhataEntryModal({
  isOpen,
  onClose,
  khataId,
  currency,
  entry,
}: KhataEntryModalProps) {
  const isEditing = Boolean(entry)
  const createEntry = useCreateKhataEntry(khataId)
  const updateEntry = useUpdateKhataEntry(khataId)

  const [formError, setFormError] = useState<string | null>(null)

  const defaults: EntryValues = {
    entry_type: entry?.entry_type ?? 'given',
    amount: entry?.amount ?? '',
    entry_date: entry?.entry_date ?? todayIso(),
    description: entry?.description ?? '',
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EntryValues>({ resolver: zodResolver(entrySchema), defaultValues: defaults })

  useEffect(() => {
    if (isOpen) reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entry?.id, reset])

  // `useWatch` rather than `watch()`: the latter returns a fresh function each
  // render, which the React Compiler cannot memoize safely.
  const entryType = useWatch({ control, name: 'entry_type' })

  const close = () => {
    setFormError(null)
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    const payload = {
      entry_type: values.entry_type,
      amount: values.amount.trim(),
      entry_date: values.entry_date,
      description: values.description?.trim() || null,
    }

    try {
      if (isEditing && entry) {
        await updateEntry.mutateAsync({ entryId: entry.id, input: payload })
      } else {
        await createEntry.mutateAsync(payload)
      }
      close()
    } catch (error) {
      if (isApiError(error)) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          setError(field as keyof EntryValues, { message })
        }
      }
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={isEditing ? 'Edit entry' : 'Add entry'}
      description={
        isEditing
          ? 'The balance follows from the entries, so this changes it.'
          : 'What passed between you, and which way.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add entry'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-slate-700">Type</legend>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                data-on={entryType === type.value}
                aria-pressed={entryType === type.value}
                onClick={() => setValue('entry_type', type.value, { shouldValidate: true })}
                className={cn(
                  'rounded-lg border border-slate-200 px-3 py-2.5 text-left transition',
                  'hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  type.tone,
                )}
              >
                <span className="block text-sm font-medium">{type.label}</span>
                <span className="mt-0.5 block text-xs opacity-80">{type.hint}</span>
              </button>
            ))}
          </div>
          <input type="hidden" {...register('entry_type')} />
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={`Amount (${currency})`}
            placeholder="0.00"
            inputMode="decimal"
            autoComplete="off"
            error={errors.amount?.message}
            hint={
              entryType === 'adjustment'
                ? 'A negative amount reduces what they owe you.'
                : undefined
            }
            {...register('amount')}
          />
          <Input
            label="Date"
            type="date"
            max={todayIso()}
            error={errors.entry_date?.message}
            {...register('entry_date')}
          />
        </div>

        <Textarea
          label="Note (optional)"
          placeholder={entryType === 'adjustment' ? 'Corrected a double entry' : 'Laptop'}
          rows={2}
          error={errors.description?.message}
          {...register('description')}
        />

        {/*
          Attachments are in the brief but are not built: nothing in the app stores
          files yet — no object storage, no upload endpoint, no way to serve one
          back. Saying so is better than an input that silently drops what it takes.
        */}
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Attaching a photo of a receipt is not available yet — it needs file storage,
          which the app does not have.
        </p>
      </form>
    </Modal>
  )
}
