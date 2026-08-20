import { apiClient } from '@/lib/api-client'
import type {
  CategorySpending,
  Dashboard,
  Granularity,
  GroupStatistics,
  SpendingSeries,
} from '@/types/api'

export interface AnalyticsWindow {
  start_date?: string
  end_date?: string
  currency?: string
  granularity?: Granularity
  count?: number
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

  async series(params: AnalyticsWindow & { group_id?: string } = {}): Promise<SpendingSeries> {
    const { data } = await apiClient.get<SpendingSeries>('/analytics/spending-series', {
      params,
    })
    return data
  },

  async groups(params: AnalyticsWindow = {}): Promise<GroupStatistics[]> {
    const { data } = await apiClient.get<GroupStatistics[]>('/analytics/groups', { params })
    return data
  },
}
