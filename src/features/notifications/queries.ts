import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-client'

import { notificationApi, type NotificationListParams } from './api'

/** How often the bell checks for news. The endpoint is a single indexed count. */
const POLL_INTERVAL_MS = 30_000

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: notificationApi.unreadCount,
    select: (data) => data.count,
    refetchInterval: POLL_INTERVAL_MS,
    // The app turns this off globally; coming back to the tab is exactly when a
    // stale badge is most noticeable.
    refetchOnWindowFocus: true,
  })
}

export function useNotifications(params: NotificationListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notificationApi.list(params),
    placeholderData: (previous) => previous,
    enabled: options.enabled ?? true,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.markRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}
