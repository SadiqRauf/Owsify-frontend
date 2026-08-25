import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/use-auth'
import { useBalanceWith } from '@/features/balances/queries'
import { getErrorMessage, isApiError } from '@/lib/api-client'
import { currencySymbol } from '@/lib/currencies'
import { formatAbsMoney, toCents } from '@/lib/money'
import { PAYMENT_METHODS, type PaymentMethod, type User } from '@/types/api'

import { useCreateSettlement } from './queries'

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  card: 'Card',
  paypal: 'PayPal',
  venmo: 'Venmo',
  upi: 'UPI',
  other: 'Other',
}

const settlementSchema = z.object({
  counterparty_id: z.string().min(1, 'Choose who you are settling with.'),
  direction: z.enum(['you_paid', 'they_paid']),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter an amount.')
    .regex(/^\d+(\.\d{1,2})?$/, 'Use a number with up to 2 decimal places.')
    .refine((value) => toCents(value) > 0, 'The amount must be greater than zero.'),
  currency: z.string().trim().length(3),
  settled_on: z.string().min(1, 'Pick a date.'),
  method: z.enum(PAYMENT_METHODS),
  notes: z.string().trim().max(2000).optional(),
})

type SettlementValues = z.infer<typeof settlementSchema>

function todayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

interface SettleUpModalProps {
  isOpen: boolean
  onClose: () => void
  /** Who can be settled with: group members, or your friends. */
  candidates: User[]
  groupId?: string | null
  currency?: string
  /** Preselect a person, e.g. from a "Settle up" button on a balance row. */
  defaultCounterpartyId?: string
}

export function SettleUpModal({
  isOpen,
  onClose,
  candidates,
  groupId,
  currency = 'USD',
  defaultCounterpartyId,
}: SettleUpModalProps) {
  const { user } = useAuth()
  const createSettlement = useCreateSettlement()
  const [formError, setFormError] = useState<string | null>(null)

  const others = useMemo(
    () => candidates.filter((candidate) => candidate.id !== user?.id),
    [candidates, user?.id],
  )

  // A preselection that is not in the list would leave the <select> showing its
  // first option while the form held the absent id, so a submit would record a
  // payment against the wrong person. Fall back to the first option instead.
  const initialCounterpartyId =
    defaultCounterpartyId && others.some((person) => person.id === defaultCounterpartyId)
      ? defaultCounterpartyId
      : (others[0]?.id ?? '')

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettlementValues>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      counterparty_id: initialCounterpartyId,
      direction: 'you_paid',
      amount: '',
      currency,
      settled_on: todayIso(),
      method: 'cash',
      notes: '',
    },
  })

  const counterpartyId = useWatch({ control, name: 'counterparty_id' })
  const direction = useWatch({ control, name: 'direction' })
  const selectedCurrency = useWatch({ control, name: 'currency' }) || currency

  // What is actually outstanding between the two of you, so the form can prefill
  // the right direction and amount rather than making someone work out the sign.
  const { data: outstanding } = useBalanceWith(counterpartyId || undefined, groupId ?? undefined)

  const owed = useMemo(
    () => outstanding?.find((entry) => entry.currency === selectedCurrency),
    [outstanding, selectedCurrency],
  )

  useEffect(() => {
    if (!isOpen) return
    reset({
      counterparty_id: initialCounterpartyId,
      direction: 'you_paid',
      amount: '',
      currency,
      settled_on: todayIso(),
      method: 'cash',
      notes: '',
    })
  }, [isOpen, initialCounterpartyId, currency, reset])

  const counterparty = others.find((person) => person.id === counterpartyId)
  const youPaid = direction === 'you_paid'

  const applySuggestion = () => {
    if (!owed) return
    const cents = toCents(owed.amount)
    // Positive means they owe you, so settling means they pay.
    setValue('direction', cents > 0 ? 'they_paid' : 'you_paid')
    setValue('amount', (Math.abs(cents) / 100).toFixed(2))
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    if (!user) return

    try {
      await createSettlement.mutateAsync({
        group_id: groupId ?? null,
        from_user_id: values.direction === 'you_paid' ? user.id : values.counterparty_id,
        to_user_id: values.direction === 'you_paid' ? values.counterparty_id : user.id,
        amount: values.amount,
        currency: values.currency,
        settled_on: values.settled_on,
        method: values.method,
        notes: values.notes?.trim() || null,
      })
      onClose()
    } catch (error) {
      setFormError(getErrorMessage(error))
      if (!isApiError(error)) throw error
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settle up"
      description="Record a payment between you and someone else."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={isSubmitting} disabled={others.length === 0}>
            Record payment
          </Button>
        </>
      }
    >
      {others.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">
          There is nobody here to settle up with yet.
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {formError && <Alert tone="error">{formError}</Alert>}

          <Select
            label="Settle with"
            options={others.map((person) => ({ value: person.id, label: person.full_name }))}
            error={errors.counterparty_id?.message}
            {...register('counterparty_id')}
          />

          {owed && toCents(owed.amount) !== 0 && (
            <Alert tone="info">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  {toCents(owed.amount) > 0
                    ? `${counterparty?.full_name} owes you ${formatAbsMoney(owed.amount, owed.currency)}.`
                    : `You owe ${counterparty?.full_name} ${formatAbsMoney(owed.amount, owed.currency)}.`}
                </span>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
                >
                  Settle in full
                </button>
              </div>
            </Alert>
          )}

          {/* Direction: stated as a sentence, because a sign alone is easy to misread. */}
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium text-slate-700">Who paid?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['you_paid', 'they_paid'] as const).map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm ring-1 ring-inset transition-colors ${
                    direction === option
                      ? 'bg-brand-50 text-brand-800 ring-brand-300'
                      : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    value={option}
                    className="size-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                    {...register('direction')}
                  />
                  {option === 'you_paid'
                    ? `You paid ${counterparty?.full_name ?? 'them'}`
                    : `${counterparty?.full_name ?? 'They'} paid you`}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={`Amount (${currencySymbol(selectedCurrency)})`}
              inputMode="decimal"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register('amount')}
            />
            <Input
              label="Date"
              type="date"
              max={todayIso()}
              error={errors.settled_on?.message}
              {...register('settled_on')}
            />
          </div>

          {groupId ? (
            <Select
              label="Currency"
              options={[{ value: selectedCurrency, label: selectedCurrency }]}
              value={selectedCurrency}
              disabled
              hint="Set by the group."
              onChange={() => undefined}
            />
          ) : (
            <CurrencySelect
              ensureCode={selectedCurrency}
              error={errors.currency?.message}
              {...register('currency')}
            />
          )}

          <Select
            label="Payment method"
            options={PAYMENT_METHODS.map((method) => ({
              value: method,
              label: METHOD_LABELS[method],
            }))}
            error={errors.method?.message}
            {...register('method')}
          />

          <Textarea
            label="Notes"
            placeholder="Optional"
            rows={2}
            error={errors.notes?.message}
            {...register('notes')}
          />

          {counterparty && (
            <div className="flex items-center justify-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span className="flex items-center gap-2">
                <Avatar name={youPaid ? (user?.full_name ?? '?') : counterparty.full_name} size="sm" />
                <span className="font-medium text-slate-900">{youPaid ? 'You' : counterparty.full_name}</span>
              </span>
              <ArrowRight aria-hidden className="size-4 text-slate-400" />
              <span className="flex items-center gap-2">
                <Avatar name={youPaid ? counterparty.full_name : (user?.full_name ?? '?')} size="sm" />
                <span className="font-medium text-slate-900">{youPaid ? counterparty.full_name : 'You'}</span>
              </span>
            </div>
          )}
        </form>
      )}
    </Modal>
  )
}
