import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { getErrorMessage, isApiError } from '@/lib/api-client'
import type { Reminder } from '@/types/api'

import type { SubjectInput } from './api'
import { useCreateReminder, useUpdateReminder } from './queries'

const reminderSchema = z
  .object({
    title: z.string().trim().min(1, 'What is this reminder for?').max(200, 'Title is too long.'),
    due_date: z.string().min(1, 'Pick a due date.'),
    remind_on: z.string().optional(),
    amount: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || /^\d*\.?\d{0,2}$/.test(value),
        'Use a number, up to two decimals.',
      ),
    currency: z.string().trim().length(3),
    notes: z.string().trim().max(5000).optional(),
  })
  .refine((values) => !values.remind_on || values.remind_on <= values.due_date, {
    path: ['remind_on'],
    message: 'A reminder after the due date would arrive too late to be useful.',
  })

type ReminderValues = z.infer<typeof reminderSchema>

export function ReminderModal({
  isOpen,
  onClose,
  subject,
  subjectLabel,
  reminder,
  defaultCurrency = 'PKR',
}: {
  isOpen: boolean
  onClose: () => void
  subject: SubjectInput
  subjectLabel?: string
  /** Omit to add; pass one to edit. */
  reminder?: Reminder
  defaultCurrency?: string
}) {
  const isEditing = Boolean(reminder)
  const createReminder = useCreateReminder()
  const updateReminder = useUpdateReminder()

  const [formError, setFormError] = useState<string | null>(null)

  const defaults: ReminderValues = {
    title: reminder?.title ?? (subjectLabel ? `Collect from ${subjectLabel}` : ''),
    due_date: reminder?.due_date ?? '',
    remind_on: reminder?.remind_on ?? '',
    amount: reminder?.amount ?? '',
    currency: reminder?.currency ?? defaultCurrency,
    notes: reminder?.notes ?? '',
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReminderValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (isOpen) reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reminder?.id, reset])

  const close = () => {
    setFormError(null)
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    const payload = {
      title: values.title,
      due_date: values.due_date,
      remind_on: values.remind_on || null,
      // An amount without a currency is meaningless, so both go or neither does.
      amount: values.amount?.trim() || null,
      currency: values.amount?.trim() ? values.currency : null,
      notes: values.notes?.trim() || null,
    }

    try {
      if (isEditing && reminder) {
        await updateReminder.mutateAsync({ reminderId: reminder.id, input: payload })
      } else {
        await createReminder.mutateAsync({ ...subject, ...payload })
      }
      close()
    } catch (error) {
      if (isApiError(error)) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          setError(field as keyof ReminderValues, { message })
        }
      }
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={isEditing ? 'Edit reminder' : 'Add reminder'}
      description="When the money is expected, and when you want to be told."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add reminder'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Reminder"
          placeholder="Collect from Ahmed"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Due date"
            type="date"
            hint="When the money is expected."
            error={errors.due_date?.message}
            {...register('due_date')}
          />
          <Input
            label="Remind me on (optional)"
            type="date"
            hint="Leave blank to be told on the due date."
            error={errors.remind_on?.message}
            {...register('remind_on')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Amount (optional)"
            placeholder="40000.00"
            inputMode="decimal"
            hint="Shown on the reminder. Never added to any balance."
            error={errors.amount?.message}
            {...register('amount')}
          />
          <CurrencySelect
            ensureCode={reminder?.currency ?? defaultCurrency}
            error={errors.currency?.message}
            {...register('currency')}
          />
        </div>

        <Textarea
          label="Notes (optional)"
          placeholder="Said he would pay after the wedding"
          rows={2}
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  )
}
