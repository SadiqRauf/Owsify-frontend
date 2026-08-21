import { apiClient } from '@/lib/api-client'
import type {
  ActivityReport,
  KhataReport,
  LoanReport,
  SummaryReport,
} from '@/types/api'

export interface ReportParams {
  start_date?: string
  end_date?: string
  currency?: string
  person_user_id?: string
}

export const reportApi = {
  async summary(params: ReportParams = {}): Promise<SummaryReport> {
    const { data } = await apiClient.get<SummaryReport>('/reports/summary', { params })
    return data
  },

  async khata(params: ReportParams = {}): Promise<KhataReport> {
    const { data } = await apiClient.get<KhataReport>('/reports/khata', { params })
    return data
  },

  async loans(params: ReportParams & { include_cancelled?: boolean } = {}): Promise<LoanReport> {
    const { data } = await apiClient.get<LoanReport>('/reports/loans', { params })
    return data
  },

  async activity(
    params: ReportParams & { granularity?: 'daily' | 'monthly' } = {},
  ): Promise<ActivityReport> {
    const { data } = await apiClient.get<ActivityReport>('/reports/activity', { params })
    return data
  },
}
