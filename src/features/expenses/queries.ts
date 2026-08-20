import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { invalidateLedger, queryKeys } from '@/lib/query-client'

import { expensesApi, type ExpenseCreateInput, type ExpenseUpdateInput } from './api'

export function useExpenses(params: { groupId?: string; offset?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.expenses.list({ groupId: params.groupId, offset: params.offset }),
    queryFn: () =>
      expensesApi.list({
        group_id: params.groupId,
        offset: params.offset,
        limit: params.limit,
      }),
    // Keeps the previous page on screen while the next one loads, instead of
    // collapsing the list back to a skeleton on every page change.
    placeholderData: (previous) => previous,
  })
}

export function useExpense(expenseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(expenseId ?? ''),
    queryFn: () => expensesApi.get(expenseId!),
    enabled: Boolean(expenseId),
  })
}

export function useCreateExpense() {
  return useMutation({
    mutationFn: (input: ExpenseCreateInput) => expensesApi.create(input),
    onSuccess: (expense) => invalidateLedger(expense.group_id),
  })
}

export function useUpdateExpense(expenseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ExpenseUpdateInput) => expensesApi.update(expenseId, input),
    onSuccess: (expense) => {
      queryClient.setQueryData(queryKeys.expenses.detail(expenseId), expense)
      invalidateLedger(expense.group_id)
    },
  })
}

export function useDeleteExpense() {
  return useMutation({
    mutationFn: ({ expenseId }: { expenseId: string; groupId?: string | null }) =>
      expensesApi.remove(expenseId),
    onSuccess: (_result, { groupId }) => {
      // invalidateLedger deliberately skips expense details, and nothing removes
      // the deleted one: removing a query that still has an observer makes React
      // Query refetch it, which would ask for the row we just deleted. The detail
      // page unmounts immediately after this and gc drops the entry.
      invalidateLedger(groupId)
    },
  })
}
