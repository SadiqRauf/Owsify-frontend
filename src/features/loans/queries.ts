import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-client'

import {
  loanApi,
  type LoanCreateInput,
  type LoanListParams,
  type LoanPaymentInput,
  type LoanUpdateInput,
} from './api'

export function useLoans(params: LoanListParams = {}) {
  return useQuery({
    queryKey: queryKeys.loans.list(params),
    queryFn: () => loanApi.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useLoan(loanId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.loans.detail(loanId ?? ''),
    queryFn: () => loanApi.get(loanId!),
    enabled: Boolean(loanId),
  })
}

export function useLoanPayments(loanId: string | undefined, params: object = {}) {
  return useQuery({
    queryKey: queryKeys.loans.payments(loanId ?? '', params),
    queryFn: () => loanApi.payments(loanId!, params),
    enabled: Boolean(loanId),
    placeholderData: (previous) => previous,
  })
}

/**
 * Every loan mutation invalidates the loan, its payments, the list, and the people
 * data. `remaining` and `status` are derived server-side from the payments, and a
 * loan's outstanding amount feeds the person page's unified total — so a change
 * here makes all four stale at once.
 */
function useLoanInvalidation(loanId?: string) {
  const queryClient = useQueryClient()
  return () => {
    if (loanId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.loans.detail(loanId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.loans.paymentsFor(loanId) })
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.loans.lists })
    void queryClient.invalidateQueries({ queryKey: queryKeys.people.all })
  }
}

export function useCreateLoan() {
  const queryClient = useQueryClient()
  const invalidate = useLoanInvalidation()
  return useMutation({
    mutationFn: (input: LoanCreateInput) => loanApi.create(input),
    onSuccess: (loan) => {
      queryClient.setQueryData(queryKeys.loans.detail(loan.id), loan)
      invalidate()
    },
  })
}

export function useUpdateLoan(loanId: string) {
  const invalidate = useLoanInvalidation(loanId)
  return useMutation({
    mutationFn: (input: LoanUpdateInput) => loanApi.update(loanId, input),
    onSuccess: invalidate,
  })
}

export function useDeleteLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ loanId, permanent }: { loanId: string; permanent?: boolean }) =>
      loanApi.remove(loanId, permanent),
    onSuccess: () => {
      // The detail entry is left to garbage collection rather than removed:
      // removing a query that still has an observer makes React Query refetch it,
      // which would ask for a loan that has just been deleted.
      void queryClient.invalidateQueries({ queryKey: queryKeys.loans.lists })
      void queryClient.invalidateQueries({ queryKey: queryKeys.people.all })
    },
  })
}

export function useAddLoanPayment(loanId: string) {
  const invalidate = useLoanInvalidation(loanId)
  return useMutation({
    mutationFn: (input: LoanPaymentInput) => loanApi.addPayment(loanId, input),
    onSuccess: invalidate,
  })
}

export function useSettleLoan(loanId: string) {
  const invalidate = useLoanInvalidation(loanId)
  return useMutation({
    mutationFn: () => loanApi.settle(loanId),
    onSuccess: invalidate,
  })
}

export function useDeleteLoanPayment(loanId: string) {
  const invalidate = useLoanInvalidation(loanId)
  return useMutation({
    mutationFn: (paymentId: string) => loanApi.removePayment(paymentId),
    onSuccess: invalidate,
  })
}
