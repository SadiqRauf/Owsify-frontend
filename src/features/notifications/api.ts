import { apiClient } from '@/lib/api-client'
import type {
  AppNotification,
  MessageResponse,
  NotificationListPage,
  UnreadCount,
} from '@/types/api'

export interface NotificationListParams {
  unread_only?: boolean
  limit?: number
  offset?: number
}

export const notificationApi = {
  async list(params: NotificationListParams = {}): Promise<NotificationListPage> {
    const { data } = await apiClient.get<NotificationListPage>('/notifications', { params })
    return data
  },

  async unreadCount(): Promise<UnreadCount> {
    const { data } = await apiClient.get<UnreadCount>('/notifications/unread-count')
    return data
  },

  async markRead(notificationId: string): Promise<AppNotification> {
    const { data } = await apiClient.post<AppNotification>(
      `/notifications/${notificationId}/read`,
    )
    return data
  },

  async markAllRead(): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/notifications/read-all')
    return data
  },
}
