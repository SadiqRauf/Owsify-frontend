import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-client'

import { balancesApi } from './api'

export function useBalanceOverview() {
  return useQuery({
    queryKey: queryKeys.balances.overview,
    queryFn: balancesApi.overview,
  })
}

export function useGroupBalances(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.balances.group(groupId ?? ''),
    queryFn: () => balancesApi.forGroup(groupId!),
    enabled: Boolean(groupId),
  })
}

export function useSimplifiedPlan(groupId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.balances.simplified(groupId ?? ''),
    queryFn: () => balancesApi.simplifiedForGroup(groupId!),
    enabled: Boolean(groupId) && enabled,
  })
}

export function useBalanceWith(userId: string | undefined, groupId?: string) {
  return useQuery({
    queryKey: queryKeys.balances.withUser(userId ?? '', groupId),
    queryFn: () => balancesApi.withUser(userId!, groupId),
    enabled: Boolean(userId),
  })
}
