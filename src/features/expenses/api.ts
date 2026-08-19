import { apiClient } from '@/lib/api-client'
import type {
  Expense,
  ExpenseCategory,
  ExpenseListPage,
  MessageResponse,
  SplitType,
} from '@/types/api'

export interface SplitInput {
  user_id: string
  /** Ignored for equal, the exact share for exact, the percentage for percentage. */
  value?: string | null
}

export interface ExpenseCreateInput {
  group_id?: string | null
  description: string
  amount: string
  currency?: string
  expense_date: string
  category: ExpenseCategory
  notes?: string | null
  paid_by_id: string
  split_type: SplitType
  splits: SplitInput[]
}

export type ExpenseUpdateInput = Partial<ExpenseCreateInput>

export const expensesApi = {
  async list(
    params: { group_id?: string; limit?: number; offset?: number } = {},
  ): Promise<ExpenseListPage> {
    const { data } = await apiClient.get<ExpenseListPage>('/expenses', { params })
    return data
  },

  async get(expenseId: string): Promise<Expense> {
    const { data } = await apiClient.get<Expense>(`/expenses/${expenseId}`)
    return data
  },

  async create(input: ExpenseCreateInput): Promise<Expense> {
    const { data } = await apiClient.post<Expense>('/expenses', input)
    return data
  },

  async update(expenseId: string, input: ExpenseUpdateInput): Promise<Expense> {
    const { data } = await apiClient.patch<Expense>(`/expenses/${expenseId}`, input)
    return data
  },

  async remove(expenseId: string): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(`/expenses/${expenseId}`)
    return data
  }
}
