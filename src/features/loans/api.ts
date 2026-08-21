import { apiClient } from '@/lib/api-client'
import type {
  LoanDetail,
  LoanDirection,
  LoanListPage,
  LoanPaymentListPage,
  LoanStatus,
  MessageResponse,
} from '@/types/api'

export interface LoanCreateInput {
  direction?: LoanDirection
  counterparty_name: string
  counterparty_user_id?: string | null
  amount: string
  currency?: string
  due_date?: string | null
  description?: string | null
}

export type LoanUpdateInput = Partial<LoanCreateInput> & { status?: LoanStatus }

export interface LoanListParams {
  status?: LoanStatus
  direction?: LoanDirection
  counterparty_user_id?: string
  currency?: string
  search?: string
  limit?: number
  offset?: number
}

export interface LoanPaymentInput {
  amount: string
  payment_date: string
  note?: string | null
}

export const loanApi = {
  async list(params: LoanListParams = {}): Promise<LoanListPage> {
    const { data } = await apiClient.get<LoanListPage>('/loans', { params })
    return data
  },

  async get(loanId: string): Promise<LoanDetail> {
    const { data } = await apiClient.get<LoanDetail>(`/loans/${loanId}`)
    return data
  },

  async create(input: LoanCreateInput): Promise<LoanDetail> {
    const { data } = await apiClient.post<LoanDetail>('/loans', input)
    return data
  },

  async update(loanId: string, input: LoanUpdateInput): Promise<LoanDetail> {
    const { data } = await apiClient.patch<LoanDetail>(`/loans/${loanId}`, input)
    return data
  },

  /** Cancels by default, keeping the payments; `permanent` destroys the loan. */
  async remove(loanId: string, permanent = false): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(`/loans/${loanId}`, {
      params: permanent ? { permanent: true } : undefined,
    })
    return data
  },

  async payments(
    loanId: string,
    params: { start_date?: string; end_date?: string; limit?: number; offset?: number } = {},
  ): Promise<LoanPaymentListPage> {
    const { data } = await apiClient.get<LoanPaymentListPage>(`/loans/${loanId}/payments`, {
      params,
    })
    return data
  },

  async addPayment(loanId: string, input: LoanPaymentInput): Promise<LoanDetail> {
    const { data } = await apiClient.post<LoanDetail>(`/loans/${loanId}/payments`, input)
    return data
  },

  /**
   * Marks a loan paid by recording the payment that closes it, rather than setting
   * a flag the payment history would not support.
   */
  async settle(loanId: string): Promise<LoanDetail> {
    const { data } = await apiClient.post<LoanDetail>(`/loans/${loanId}/settle`)
    return data
  },

  async updatePayment(paymentId: string, input: Partial<LoanPaymentInput>): Promise<LoanDetail> {
    const { data } = await apiClient.patch<LoanDetail>(`/loans/payments/${paymentId}`, input)
    return data
  },

  async removePayment(paymentId: string): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(`/loans/payments/${paymentId}`)
    return data
  },
}
