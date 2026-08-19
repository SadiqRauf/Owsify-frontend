import { apiClient } from '@/lib/api-client'
import type {
  ActivityPage,
  ActivityType,
  MessageResponse,
  PaymentMethod,
  Settlement,
  SettlementListPage,
} from '@/types/api'

export interface SettlementCreateInput {
  group_id?: string | null
  from_user_id: string
  to_user_id: string
  amount: string
  currency?: string
  settled_on: string
  method: PaymentMethod
  notes?: string | null
}

export const settlementsApi = {
  async list(
    params: {
      group_id?: string
      with_user_id?: string
      sort?: string
      limit?: number
      offset?: number
    } = {},
  ): Promise<SettlementListPage> {
    const { data } = await apiClient.get<SettlementListPage>('/settlements', { params })
    return data
  },

  async create(input: SettlementCreateInput): Promise<Settlement> {
    const { data } = await apiClient.post<Settlement>('/settlements', input)
    return data
  },

  async remove(settlementId: string): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(`/settlements/${settlementId}`)
    return data
  },
}

export const activityApi = {
  async list(
    params: {
      group_id?: string
      with_user_id?: string
      type?: ActivityType
      order?: 'asc' | 'desc'
      limit?: number
      offset?: number
    } = {},
  ): Promise<ActivityPage> {
    const { data } = await apiClient.get<ActivityPage>('/activity', { params })
    return data
  },
}
