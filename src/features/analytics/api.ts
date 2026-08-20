import { apiClient } from '@/lib/api-client'
import type { CategorySpending, Dashboard, GroupStatistics, MonthSpending } from '@/types/api'

export interface AnalyticsWindow {
  start_date?: string
  end_date?: string
  currency?: string
  months?: number
}

export const analyticsApi = {
  async dashboard(params: AnalyticsWindow = {}): Promise<Dashboard> {
    const { data } = await apiClient.get<Dashboard>('/analytics/dashboard', { params })
    return data
  },

  async categories(
    params: AnalyticsWindow & { group_id?: string } = {},
  ): Promise<CategorySpending[]> {
    const { data } = await apiClient.get<CategorySpending[]>('/analytics/categories', { params })
    return data
  },

  async monthly(params: AnalyticsWindow & { group_id?: string } = {}): Promise<MonthSpending[]> {
    const { data } = await apiClient.get<MonthSpending[]>('/analytics/monthly', { params })
    return data
  },

  async groups(params: AnalyticsWindow = {}): Promise<GroupStatistics[]> {
    const { data } = await apiClient.get<GroupStatistics[]>('/analytics/groups', { params })
    return data
  },
}
