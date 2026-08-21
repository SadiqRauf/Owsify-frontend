import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { getErrorMessage, isApiError } from '@/lib/api-client'
import { formatMoney, toCents } from '@/lib/money'
import { todayIso } from '@/lib/utils'
import type { Loan } from '@/types/api'

import { useAddLoanPayment } from './queries'

const paymentSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'Enter an amount.')
    .refine((value) => /^\d*\.?\d{0,2}$/.test(value), 'Use a number, up to two decimals.')
    .refine((value) => Number(value) > 0, 'A payment of nothing is not a payment.'),
  payment_date: z.string().min(1, 'Pick a date.'),
  note: z.string().trim().max(200, 'Keep the note under 200 characters.').optional(),
})

type PaymentValues = z.infer<typeof paymentSchema>

export function LoanPaymentModal({
  isOpen,
  onClose,
  loan,
}: {
  isOpen: boolean
  onClose: () => void
  loan: Loan
}) {
  const addPayment = useAddLoanPayment(loan.id)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: '', payment_date: todayIso(), note: '' },
  })

  useEffect(() => {
    if (isOpen) reset({ amount: '', payment_date: todayIso(), note: '' })
  }, [isOpen, reset])

  const close = () => {
    setFormError(null)
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await addPayment.mutateAsync({
        amount: values.amount.trim(),
        payment_date: values.payment_date,
        note: values.note?.trim() || null,
      })
      close()
    } catch (error) {
      if (isApiError(error)) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          setError(field as keyof PaymentValues, { message })
        }
      }
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Add payment"
      description={`${formatMoney(loan.remaining, loan.currency)} outstanding on ${loan.display_name}'s loan.`}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={isSubmitting}>
            Add payment
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label={`Amount (${loan.currency})`}
          placeholder="20000.00"
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          hint="A partial payment is fine — that is what Remaining is for."
          {...register('amount')}
        />

        {/* Offered as a shortcut, not enforced: paying more than is outstanding is
            allowed, and the remaining figure clamps at zero rather than inverting. */}
        {toCents(loan.remaining) > 0 && (
          <button
            type="button"
            onClick={() => setValue('amount', loan.remaining, { shouldValidate: true })}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Pay the full {formatMoney(loan.remaining, loan.currency)}
          </button>
        )}

        <Input
          label="Date"
          type="date"
          max={todayIso()}
          error={errors.payment_date?.message}
          {...register('payment_date')}
        />

        <Textarea
          label="Note (optional)"
          placeholder="Cash, handed over at the shop"
          rows={2}
          error={errors.note?.message}
          {...register('note')}
        />
      </form>
    </Modal>
  )
}
