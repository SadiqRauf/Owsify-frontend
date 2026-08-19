import { z } from 'zod'

import { sumCents, toCents } from '@/lib/money'
import { EXPENSE_CATEGORIES } from '@/types/api'

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/
const PERCENT_PATTERN = /^\d+(\.\d{1,4})?$/

export const participantSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  selected: z.boolean(),
  /** Empty for an equal split; an amount or a percentage otherwise. */
  value: z.string(),
})

export const expenseSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, 'What was this for?')
      .max(200, 'Keep the description under 200 characters.'),
    amount: z
      .string()
      .trim()
      .min(1, 'Enter an amount.')
      .regex(MONEY_PATTERN, 'Use a number with up to 2 decimal places, e.g. 24.50.')
      .refine((value) => toCents(value) > 0, 'The amount must be greater than zero.'),
    expense_date: z
      .string()
      .min(1, 'Pick a date.')
      .refine((value) => {
        const chosen = new Date(`${value}T00:00:00`)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return chosen <= tomorrow
      }, 'An expense cannot be dated in the future.'),
    category: z.enum(EXPENSE_CATEGORIES),
    notes: z.string().trim().max(2000, 'Notes are too long.').optional(),
    paid_by_id: z.string().min(1, 'Choose who paid.'),
    split_type: z.enum(['equal', 'exact', 'percentage']),
    participants: z.array(participantSchema),
  })
  .superRefine((values, ctx) => {
    const selected = values.participants.filter((participant) => participant.selected)

    if (selected.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['participants'],
        message: 'Pick at least one person to split between.',
      })
      return
    }

    if (!values.participants.some((p) => p.user_id === values.paid_by_id)) {
      // The payer does not have to owe anything, but they must be someone real.
      ctx.addIssue({ code: 'custom', path: ['paid_by_id'], message: 'Choose who paid.' })
    }

    if (values.split_type === 'equal') return

    const label = values.split_type === 'exact' ? 'an amount' : 'a percentage'
    const pattern = values.split_type === 'exact' ? MONEY_PATTERN : PERCENT_PATTERN

    for (const participant of selected) {
      const index = values.participants.indexOf(participant)
      if (!participant.value.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['participants', index, 'value'],
          message: `Enter ${label}.`,
        })
      } else if (!pattern.test(participant.value.trim())) {
        ctx.addIssue({
          code: 'custom',
          path: ['participants', index, 'value'],
          message: 'Enter a valid number.',
        })
      }
    }

    // Only check the totals once every individual value is well-formed, so the
    // user sees one clear problem at a time.
    if (selected.some((p) => !pattern.test(p.value.trim()))) return

    if (values.split_type === 'exact') {
      const assigned = sumCents(selected.map((p) => p.value))
      const total = toCents(values.amount)
      if (assigned !== total) {
        const difference = (Math.abs(total - assigned) / 100).toFixed(2)
        ctx.addIssue({
          code: 'custom',
          path: ['participants'],
          message:
            assigned > total
              ? `That is ${difference} more than the total. Remove ${difference}.`
              : `That leaves ${difference} unassigned. Add ${difference}.`,
        })
      }
      return
    }

    const percent = selected.reduce((total, p) => total + Number(p.value), 0)
    if (Math.abs(percent - 100) > 0.0001) {
      ctx.addIssue({
        code: 'custom',
        path: ['participants'],
        message: `Percentages add up to ${Number(percent.toFixed(4))}%, and must add up to 100%.`,
      })
    }
  })

export type ExpenseValues = z.infer<typeof expenseSchema>
export type ParticipantValue = z.infer<typeof participantSchema>
