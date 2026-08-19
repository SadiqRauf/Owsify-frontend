import { apiClient } from '@/lib/api-client'
import type {
  BalanceOverview,
  GroupBalanceOverview,
  PersonBalance,
  SimplifiedPlan,
} from '@/types/api'

export const balancesApi = {
  async overview(): Promise<BalanceOverview> {
    const { data } = await apiClient.get<BalanceOverview>('/balances/me')
    return data
  },

  async forGroup(groupId: string): Promise<GroupBalanceOverview> {
    const { data } = await apiClient.get<GroupBalanceOverview>(`/balances/groups/${groupId}`)
    return data
  },

  async simplifiedForGroup(groupId: string): Promise<SimplifiedPlan> {
    const { data } = await apiClient.get<SimplifiedPlan>(
      `/balances/groups/${groupId}/simplified`,
    )
    return data
  },

  async withUser(userId: string, groupId?: string): Promise<PersonBalance[]> {
    const { data } = await apiClient.get<PersonBalance[]>(`/balances/with/${userId}`, {
      params: groupId ? { group_id: groupId } : undefined,
    })
    return data
  },
}
