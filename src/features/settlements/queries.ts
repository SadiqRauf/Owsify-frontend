import { useMutation, useQuery } from '@tanstack/react-query'

import { invalidateLedger, queryKeys } from '@/lib/query-client'
import type { ActivityType } from '@/types/api'

import { activityApi, settlementsApi, type SettlementCreateInput } from './api'

export function useSettlements(
  params: {
    groupId?: string
    withUserId?: string
    sort?: string
    limit?: number
    offset?: number
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.settlements.list(params),
    queryFn: () =>
      settlementsApi.list({
        group_id: params.groupId,
        with_user_id: params.withUserId,
        sort: params.sort,
        limit: params.limit,
        offset: params.offset,
      }),
    placeholderData: (previous) => previous,
  })
}

export function useCreateSettlement() {
  return useMutation({
    mutationFn: (input: SettlementCreateInput) => settlementsApi.create(input),
    onSuccess: (settlement) => invalidateLedger(settlement.group_id),
  })
}

export function useDeleteSettlement() {
  return useMutation({
    mutationFn: ({ settlementId }: { settlementId: string; groupId?: string | null }) =>
      settlementsApi.remove(settlementId),
    onSuccess: (_result, { groupId }) => invalidateLedger(groupId),
  })
}

export function useActivity(
  params: {
    groupId?: string
    withUserId?: string
    type?: ActivityType
    order?: 'asc' | 'desc'
    limit?: number
    offset?: number
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.activity.list(params),
    queryFn: () =>
      activityApi.list({
        group_id: params.groupId,
        with_user_id: params.withUserId,
        type: params.type,
        order: params.order,
        limit: params.limit,
        offset: params.offset,
      }),
    placeholderData: (previous) => previous,
  })
}
