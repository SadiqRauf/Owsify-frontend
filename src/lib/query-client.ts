import { QueryClient } from '@tanstack/react-query'

import { isApiError } from '@/lib/api-client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 4xx responses will not change on their own; only retry network blips.
        if (isApiError(error) && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})

/** Central place for cache keys, so invalidation never relies on a stringly-typed guess. */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  friends: {
    all: ['friends'] as const,
    list: ['friends', 'list'] as const,
    requests: (direction: 'incoming' | 'outgoing') =>
      ['friends', 'requests', direction] as const,
    search: (query: string) => ['friends', 'search', query] as const,
    invitations: ['friends', 'invitations'] as const,
  },
  groups: {
    all: ['groups'] as const,
    list: ['groups', 'list'] as const,
    detail: (groupId: string) => ['groups', 'detail', groupId] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    list: (params: { groupId?: string; offset?: number }) =>
      ['expenses', 'list', params.groupId ?? 'all', params.offset ?? 0] as const,
    detail: (expenseId: string) => ['expenses', 'detail', expenseId] as const,
  },
  balances: {
    all: ['balances'] as const,
    overview: ['balances', 'overview'] as const,
    group: (groupId: string) => ['balances', 'group', groupId] as const,
    simplified: (groupId: string) => ['balances', 'simplified', groupId] as const,
    withUser: (userId: string, groupId?: string) =>
      ['balances', 'with', userId, groupId ?? 'all'] as const,
  },
  settlements: {
    all: ['settlements'] as const,
    list: (params: { groupId?: string; withUserId?: string; offset?: number; sort?: string }) =>
      [
        'settlements',
        'list',
        params.groupId ?? 'all',
        params.withUserId ?? 'all',
        params.sort ?? '-settled_on',
        params.offset ?? 0,
      ] as const,
  },
  activity: {
    all: ['activity'] as const,
    list: (params: {
      groupId?: string
      withUserId?: string
      type?: string
      order?: string
      offset?: number
    }) =>
      [
        'activity',
        'list',
        params.groupId ?? 'all',
        params.withUserId ?? 'all',
        params.type ?? 'all',
        params.order ?? 'desc',
        params.offset ?? 0,
      ] as const,
  },
} as const

/**
 * Expenses, settlements, balances and activity are four views of the same ledger:
 * changing any transaction changes all of them. Rather than trying to work out
 * which keys are affected, every money mutation invalidates the whole set — a
 * stale balance is exactly the kind of wrong that users notice and do not forgive.
 */
export function invalidateLedger(groupId?: string | null) {
  for (const key of [
    queryKeys.expenses.all,
    queryKeys.balances.all,
    queryKeys.settlements.all,
    queryKeys.activity.all,
  ]) {
    void queryClient.invalidateQueries({ queryKey: key })
  }

  if (groupId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) })
  }
}
