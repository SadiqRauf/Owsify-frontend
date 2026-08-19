import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'

import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/use-auth'
import { getErrorMessage, isApiError } from '@/lib/api-client'
import { currencyLabel, currencySymbol } from '@/lib/currencies'
import { formatMoney, fromCents, splitEvenly, sumCents, toCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import { EXPENSE_CATEGORIES, type Expense, type SplitType, type User } from '@/types/api'

import type { SplitInput } from './api'
import { useCreateExpense, useUpdateExpense } from './queries'
import { expenseSchema, type ExpenseValues } from './schemas'

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((category) => ({
  value: category,
  label: category.charAt(0).toUpperCase() + category.slice(1),
}))

const SPLIT_TABS: Array<{ value: SplitType; label: string; hint: string }> = [
  { value: 'equal', label: 'Equally', hint: 'Everyone selected pays the same share.' },
  { value: 'exact', label: 'Exact amounts', hint: 'Enter what each person owes.' },
  { value: 'percentage', label: 'Percentages', hint: 'Enter each share as a percentage.' },
]

interface ExpenseFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** People who can be on this expense: group members, or your friends. */
  candidates: User[]
  groupId?: string | null
  currency?: string
  /** Pass an expense to edit it; omit to create a new one. */
  expense?: Expense
}

function todayIso(): string {
  const now = new Date()
  const offsetMinutes = now.getTimezoneOffset()
  return new Date(now.getTime() - offsetMinutes * 60_000).toISOString().slice(0, 10)
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  candidates,
  groupId,
  currency = 'USD',
  expense,
}: ExpenseFormModalProps) {
  const { user } = useAuth()
  const isEditing = Boolean(expense)

  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense(expense?.id ?? '')

  const [formError, setFormError] = useState<string | null>(null)

  const defaultValues = useMemo<ExpenseValues>(() => {
    const existingSplits = new Map(expense?.splits.map((split) => [split.user.id, split]) ?? [])

    return {
      description: expense?.description ?? '',
      amount: expense?.amount ?? '',
      expense_date: expense?.expense_date ?? todayIso(),
      category: expense?.category ?? 'general',
      notes: expense?.notes ?? '',
      paid_by_id: expense?.paid_by.id ?? user?.id ?? '',
      currency: expense?.currency ?? currency,
      split_type: expense?.split_type ?? 'equal',
      participants: candidates.map((candidate) => {
        const split = existingSplits.get(candidate.id)
        return {
          user_id: candidate.id,
          full_name: candidate.full_name,
          // A new expense starts with everyone included, which is the common case.
          selected: expense ? Boolean(split) : true,
          value: split
            ? expense?.split_type === 'percentage'
              ? (split.percentage ?? '')
              : split.amount
            : '',
        }
      }),
    }
  }, [candidates, currency, expense, user?.id])

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues,
    mode: 'onSubmit',
  })

  const { fields } = useFieldArray({ control, name: 'participants' })

  // Reopening the modal for a different expense must not show the previous one.
  useEffect(() => {
    if (isOpen) reset(defaultValues)
  }, [isOpen, defaultValues, reset])

  const amount = useWatch({ control, name: 'amount' })
  const splitType = useWatch({ control, name: 'split_type' })
  // A group fixes the currency for every expense in it; a personal expense is free
  // to use any, so only then is the selector live.
  const selectedCurrency = useWatch({ control, name: 'currency' }) || currency
  const participants = useWatch({ control, name: 'participants' })

  const selected = (participants ?? []).filter((participant) => participant.selected)
  const totalCents = toCents(amount)

  /** What each selected person ends up owing, mirroring the server's arithmetic. */
  const preview = useMemo(() => {
    if (selected.length === 0 || totalCents <= 0) return new Map<string, number>()

    if (splitType === 'equal') {
      const shares = splitEvenly(totalCents, selected.length)
      return new Map(selected.map((participant, index) => [participant.user_id, shares[index]]))
    }

    if (splitType === 'exact') {
      return new Map(selected.map((p) => [p.user_id, toCents(p.value)]))
    }

    return new Map(
      selected.map((p) => [p.user_id, Math.round((totalCents * Number(p.value || 0)) / 100)]),
    )
  }, [selected, splitType, totalCents])

  const assignedCents = useMemo(() => {
    if (splitType === 'exact') return sumCents(selected.map((p) => p.value))
    return [...preview.values()].reduce((total, cents) => total + cents, 0)
  }, [preview, selected, splitType])

  const remainderCents = totalCents - assignedCents

  const close = () => {
    setFormError(null)
    onClose()
  }

  /** Prefill the per-person boxes so switching split type is not a blank slate. */
  const applySplitType = (next: SplitType) => {
    setValue('split_type', next, { shouldValidate: false })

    const current = getValues('participants')
    const chosen = current.filter((participant) => participant.selected)
    if (chosen.length === 0 || toCents(getValues('amount')) <= 0) return

    if (next === 'exact') {
      const shares = splitEvenly(toCents(getValues('amount')), chosen.length)
      let index = 0
      current.forEach((participant, position) => {
        if (participant.selected) {
          setValue(`participants.${position}.value`, fromCents(shares[index]))
          index += 1
        }
      })
      return
    }

    if (next === 'percentage') {
      const even = (100 / chosen.length).toFixed(2)
      current.forEach((participant, position) => {
        if (participant.selected) setValue(`participants.${position}.value`, even)
      })
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    const splits: SplitInput[] = values.participants
      .filter((participant) => participant.selected)
      .map((participant) => ({
        user_id: participant.user_id,
        value: values.split_type === 'equal' ? null : participant.value.trim(),
      }))

    const payload = {
      description: values.description,
      amount: values.amount,
      expense_date: values.expense_date,
      category: values.category,
      notes: values.notes?.trim() ? values.notes.trim() : null,
      paid_by_id: values.paid_by_id,
      split_type: values.split_type,
      splits,
    }

    try {
      if (isEditing) {
        await updateExpense.mutateAsync(payload)
      } else {
        await createExpense.mutateAsync({
          ...payload,
          group_id: groupId ?? null,
          // A group expense always takes the group's currency server-side.
          currency: groupId ? currency : values.currency,
        })
      }
      close()
    } catch (error) {
      if (isApiError(error)) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          if (field === 'description' || field === 'amount' || field === 'expense_date') {
            setError(field as keyof ExpenseValues, { message })
          }
        }
      }
      setFormError(getErrorMessage(error))
    }
  })

  const payerOptions = candidates.map((candidate) => ({
    value: candidate.id,
    label: candidate.id === user?.id ? `${candidate.full_name} (you)` : candidate.full_name,
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      size="lg"
      title={isEditing ? 'Edit expense' : 'Add an expense'}
      description={
        isEditing ? 'Changes recalculate everyone’s share.' : 'Who paid, and how it divides.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add expense'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Description"
          placeholder="Dinner at Luigi's"
          error={errors.description?.message}
          {...register('description')}
        />

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
            error={errors.expense_date?.message}
            {...register('expense_date')}
          />
        </div>

        {groupId ? (
          // Locked, but shown, so it is never a surprise which currency was used.
          <Select
            label="Currency"
            options={[{ value: selectedCurrency, label: currencyLabel(selectedCurrency) }]}
            value={selectedCurrency}
            disabled
            hint="Set by the group, so its expenses stay in one currency."
            onChange={() => undefined}
          />
        ) : (
          <CurrencySelect
            ensureCode={selectedCurrency}
            error={errors.currency?.message}
            {...register('currency')}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            error={errors.category?.message}
            {...register('category')}
          />
          <Select
            label="Paid by"
            options={payerOptions}
            error={errors.paid_by_id?.message}
            {...register('paid_by_id')}
          />
        </div>

        {/* --- Split --- */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700">Split</legend>

          <div role="tablist" className="flex rounded-lg bg-slate-100 p-1">
            {SPLIT_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={splitType === tab.value}
                onClick={() => applySplitType(tab.value)}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  splitType === tab.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            {SPLIT_TABS.find((tab) => tab.value === splitType)?.hint}
          </p>

          <ul className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
            {fields.map((field, index) => {
              const isSelected = participants?.[index]?.selected ?? false
              const share = preview.get(field.user_id) ?? 0
              const valueError = errors.participants?.[index]?.value?.message

              return (
                <li key={field.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Controller
                    control={control}
                    name={`participants.${index}.selected`}
                    render={({ field: checkbox }) => (
                      <input
                        type="checkbox"
                        checked={checkbox.value}
                        onChange={(event) => checkbox.onChange(event.target.checked)}
                        aria-label={`Include ${field.full_name}`}
                        className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                    )}
                  />

                  <Avatar name={field.full_name} size="sm" />

                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-sm',
                      isSelected ? 'text-slate-900' : 'text-slate-400',
                    )}
                  >
                    {field.full_name}
                    {field.user_id === user?.id && ' (you)'}
                  </span>

                  {splitType === 'equal' ? (
                    <span
                      className={cn(
                        'text-sm tabular-nums',
                        isSelected ? 'font-medium text-slate-900' : 'text-slate-300',
                      )}
                    >
                      {isSelected ? formatMoney(share / 100, selectedCurrency) : '—'}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={!isSelected}
                        placeholder={splitType === 'percentage' ? '0' : '0.00'}
                        aria-label={`${splitType === 'percentage' ? 'Percentage' : 'Amount'} for ${field.full_name}`}
                        aria-invalid={valueError ? true : undefined}
                        className={cn(
                          'w-24 rounded-lg border-0 px-2 py-1 text-right text-sm tabular-nums',
                          'ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-500',
                          'disabled:bg-slate-50 disabled:text-slate-300',
                          valueError && 'ring-red-400',
                        )}
                        {...register(`participants.${index}.value`)}
                      />
                      {splitType === 'percentage' && (
                        <span className="w-16 text-right text-xs tabular-nums text-slate-500">
                          {isSelected ? formatMoney(share / 100, selectedCurrency) : ''}
                        </span>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Running total, so a mismatch is visible before submitting. */}
          {splitType !== 'equal' && totalCents > 0 && selected.length > 0 && (
            <div
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2 text-sm',
                remainderCents === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800',
              )}
            >
              <span>
                {splitType === 'exact'
                  ? `${formatMoney(assignedCents / 100, selectedCurrency)} of ${formatMoney(totalCents / 100, selectedCurrency)} assigned`
                  : `${selected.reduce((sum, p) => sum + Number(p.value || 0), 0).toFixed(2)}% assigned`}
              </span>
              <span className="font-medium tabular-nums">
                {remainderCents === 0
                  ? 'Balanced'
                  : `${formatMoney(Math.abs(remainderCents) / 100, selectedCurrency)} ${remainderCents > 0 ? 'left' : 'over'}`}
              </span>
            </div>
          )}

          {errors.participants?.message && (
            <p role="alert" className="text-sm text-red-600">
              {errors.participants.message}
            </p>
          )}
          {errors.participants?.root?.message && (
            <p role="alert" className="text-sm text-red-600">
              {errors.participants.root.message}
            </p>
          )}
        </fieldset>

        <Textarea label="Notes" placeholder="Optional" error={errors.notes?.message} {...register('notes')} />
      </form>
    </Modal>
  )
}
