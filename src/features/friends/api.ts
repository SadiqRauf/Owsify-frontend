import { apiClient } from '@/lib/api-client'
import type {
  FriendSummary,
  Friendship,
  MessageResponse,
  UserSearchResult,
} from '@/types/api'

export const friendsApi = {
  async list(): Promise<FriendSummary[]> {
    const { data } = await apiClient.get<FriendSummary[]>('/friends')
    return data
  },

  async requests(direction: 'incoming' | 'outgoing'): Promise<Friendship[]> {
    const { data } = await apiClient.get<Friendship[]>('/friends/requests', {
      params: { direction },
    })
    return data
  },

  async sendRequest(target: { user_id: string } | { email: string }): Promise<Friendship> {
    const { data } = await apiClient.post<Friendship>('/friends/requests', target)
    return data
  },

  async accept(friendshipId: string): Promise<Friendship> {
    const { data } = await apiClient.post<Friendship>(
      `/friends/requests/${friendshipId}/accept`,
    )
    return data
  },

  async reject(friendshipId: string): Promise<Friendship> {
    const { data } = await apiClient.post<Friendship>(
      `/friends/requests/${friendshipId}/reject`,
    )
    return data
  },

  async cancel(friendshipId: string): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(
      `/friends/requests/${friendshipId}`,
    )
    return data
  },

  async remove(userId: string): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(`/friends/${userId}`)
    return data
  },

  async search(query: string): Promise<UserSearchResult[]> {
    const { data } = await apiClient.get<UserSearchResult[]>('/users/search', {
      params: { q: query },
    })
    return data
  },
}
