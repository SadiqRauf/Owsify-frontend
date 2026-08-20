import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-client'

import { analyticsApi, type AnalyticsWindow } from './api'

export function useDashboard(params: AnalyticsWindow = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(params),
    queryFn: () => analyticsApi.dashboard(params),
    // Keep the previous window on screen while a filter change loads, rather
    // than collapsing the whole dashboard back to skeletons on every click.
    placeholderData: (previous) => previous,
  })
}
