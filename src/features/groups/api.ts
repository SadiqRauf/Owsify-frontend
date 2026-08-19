import { apiClient } from '@/lib/api-client'
import type {
  ExpenseListPage,
  Group,
  GroupDetail,
  GroupRole,
  MessageResponse,
} from '@/types/api'

export interface GroupCreateInput {
  name: string
  description?: string | null
  currency?: string
  emoji?: string | null
  member_ids?: string[]
}

export type GroupUpdateInput = Partial<Omit<GroupCreateInput, 'member_ids'>>

export const groupsApi = {
  async list(): Promise<Group[]> {
    const { data } = await apiClient.get<Group[]>('/groups')
    return data
  },

  async get(groupId: string): Promise<GroupDetail> {
    const { data } = await apiClient.get<GroupDetail>(`/groups/${groupId}`)
    return data
  },

  async create(input: GroupCreateInput): Promise<GroupDetail> {
    const { data } = await apiClient.post<GroupDetail>('/groups', input)
    return data
  },

  async update(groupId: string, input: GroupUpdateInput): Promise<GroupDetail> {
    const { data } = await apiClient.patch<GroupDetail>(`/groups/${groupId}`, input)
    return data
  },

  async remove(groupId: string): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(`/groups/${groupId}`)
    return data
  },

  async addMembers(
    groupId: string,
    input: { user_ids?: string[]; emails?: string[] },
  ): Promise<GroupDetail> {
    const { data } = await apiClient.post<GroupDetail>(`/groups/${groupId}/members`, input)
    return data
  },

  async removeMember(groupId: string, userId: string): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(
      `/groups/${groupId}/members/${userId}`,
    )
    return data
  },

  async setRole(groupId: string, userId: string, role: GroupRole): Promise<GroupDetail> {
    const { data } = await apiClient.patch<GroupDetail>(
      `/groups/${groupId}/members/${userId}`,
      { role },
    )
    return data
  },

  async expenses(
    groupId: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<ExpenseListPage> {
    const { data } = await apiClient.get<ExpenseListPage>(`/groups/${groupId}/expenses`, {
      params,
    })
    return data
  },
}
