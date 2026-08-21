import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import { toCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Loan } from '@/types/api'

import { useCreateLoan, useUpdateLoan } from './queries'

const loanSchema = z.object({
  direction: z.enum(['given', 'taken']),
  counterparty_name: z
    .string()
    .trim()
    .min(1, 'Who is this loan with?')
    .max(120, 'Name must be at most 120 characters.'),
  counterparty_user_id: z.string().optional(),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter an amount.')
    .refine((value) => /^\d*\.?\d{0,2}$/.test(value), 'Use a number, up to two decimals.')
    .refine((value) => Number(value) > 0, 'A loan of nothing is not a loan.'),
  currency: z.string().trim().length(3),
  // Optional on purpose: plenty of real lending has no agreed date, and inventing
  // one would make every such loan permanently active or permanently late.
  due_date: z.string().optional(),
  description: z.string().trim().max(2000, 'Description is too long.').optional(),
})

type LoanValues = z.infer<typeof loanSchema>

interface LoanFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** Omit to give a new loan; pass one to edit it. */
  loan?: Loan
  onCreated?: (loan: Loan) => void
}

export function LoanFormModal({ isOpen, onClose, loan, onCreated }: LoanFormModalProps) {
  const isEditing = Boolean(loan)
  const { data: friends } = useFriends()

  const createLoan = useCreateLoan()
  const updateLoan = useUpdateLoan(loan?.id ?? '')

  const [formError, setFormError] = useState<string | null>(null)

  const defaults: LoanValues = {
    direction: loan?.direction ?? 'given',
    counterparty_name: loan?.counterparty_name ?? '',
    counterparty_user_id: loan?.counterparty_user?.id ?? '',
    amount: loan?.amount ?? '',
    currency: loan?.currency ?? 'PKR',
    due_date: loan?.due_date ?? '',
    description: loan?.description ?? '',
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoanValues>({ resolver: zodResolver(loanSchema), defaultValues: defaults })

  // `useWatch` rather than `watch()`: the latter returns a fresh function each
  // render, which the React Compiler cannot memoize safely.
  const direction = useWatch({ control, name: 'direction' })

  useEffect(() => {
    if (isOpen) reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loan?.id, reset])

  const close = () => {
    setFormError(null)
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    // Guarded here as well as server-side: lowering the principal below what has
    // already been repaid would describe a loan its own history contradicts, and
    // saying so before the round trip is friendlier than a 422.
    if (loan && toCents(values.amount) < toCents(loan.paid)) {
      setError('amount', {
        message: `${loan.paid} has already been repaid. Remove a payment first if the principal was wrong.`,
      })
      return
    }

    const payload = {
      direction: values.direction,
      counterparty_name: values.counterparty_name,
      counterparty_user_id: values.counterparty_user_id || null,
      amount: values.amount.trim(),
      currency: values.currency,
      due_date: values.due_date || null,
      description: values.description?.trim() || null,
    }

    try {
      if (isEditing) {
        await updateLoan.mutateAsync(payload)
      } else {
        const created = await createLoan.mutateAsync(payload)
        onCreated?.(created)
      }
      close()
    } catch (error) {
      if (isApiError(error)) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          setError(field as keyof LoanValues, { message })
        }
      }
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={isEditing ? 'Edit loan' : 'Record a loan'}
      description={
        isEditing
          ? 'Change the direction, the principal, the person or the due date.'
          : 'A name is all you need — they do not have to be on Owsify.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Save loan'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        {/*
          Direction comes first and is a pair of buttons rather than a select: it
          changes the meaning of every other field on the form, so it should be
          decided before they are filled in and visible without opening anything.
        */}
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-slate-700">
            Which way did the money go?
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: 'given', label: 'I gave a loan', hint: 'They owe you' },
                { value: 'taken', label: 'I took a loan', hint: 'You owe them' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                data-on={direction === option.value}
                aria-pressed={direction === option.value}
                onClick={() => setValue('direction', option.value, { shouldValidate: true })}
                className={cn(
                  'rounded-lg border border-slate-200 px-3 py-2.5 text-left transition',
                  'hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  option.value === 'given'
                    ? 'data-[on=true]:border-emerald-500 data-[on=true]:bg-emerald-50 data-[on=true]:text-emerald-700'
                    : 'data-[on=true]:border-amber-500 data-[on=true]:bg-amber-50 data-[on=true]:text-amber-700',
                )}
              >
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="mt-0.5 block text-xs opacity-80">{option.hint}</span>
              </button>
            ))}
          </div>
          <input type="hidden" {...register('direction')} />
        </fieldset>

        <Input
          label={direction === 'taken' ? 'Lender' : 'Borrower'}
          placeholder="Ahmed"
          autoComplete="off"
          error={errors.counterparty_name?.message}
          {...register('counterparty_name')}
        />

        {/* Linking is optional and comes after the name, so the common case is not
            gated behind finding an account. */}
        {friends && friends.length > 0 && (
          <Select
            label="Link an Owsify account (optional)"
            hint="Links the loan to their account, so it counts towards their total."
            options={[
              { value: '', label: 'Not linked' },
              ...friends.map((friend) => ({
                value: friend.user.id,
                label: friend.user.full_name,
              })),
            ]}
            error={errors.counterparty_user_id?.message}
            {...register('counterparty_user_id')}
            onChange={(event) => {
              const chosen = friends.find((f) => f.user.id === event.target.value)
              setValue('counterparty_user_id', event.target.value)
              if (chosen) setValue('counterparty_name', chosen.user.full_name)
            }}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Amount"
            placeholder="50000.00"
            inputMode="decimal"
            autoComplete="off"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <CurrencySelect
            ensureCode={loan?.currency ?? 'PKR'}
            error={errors.currency?.message}
            {...register('currency')}
          />
        </div>

        <Input
          label="Due date (optional)"
          type="date"
          hint="Leave blank if there is no agreed date."
          error={errors.due_date?.message}
          {...register('due_date')}
        />

        <Textarea
          label="Description (optional)"
          placeholder="For the shop renovation"
          rows={2}
          error={errors.description?.message}
          {...register('description')}
        />
      </form>
    </Modal>
  )
}
