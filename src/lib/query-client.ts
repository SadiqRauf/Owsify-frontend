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
    balances: (groupId?: string) => ['expenses', 'balances', groupId ?? 'all'] as const,
  },
} as const

/**
 * Anything that changes an expense also changes balances and the lists it appears
 * in, so mutations invalidate the whole expense tree rather than guessing at keys.
 */
export function invalidateExpenseData(groupId?: string | null) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
  if (groupId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) })
  }
}
