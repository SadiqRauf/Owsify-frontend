import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-client'

import { friendsApi } from './api'

export function useFriends() {
  return useQuery({
    queryKey: queryKeys.friends.list,
    queryFn: friendsApi.list,
  })
}

export function useFriendRequests(direction: 'incoming' | 'outgoing') {
  return useQuery({
    queryKey: queryKeys.friends.requests(direction),
    queryFn: () => friendsApi.requests(direction),
  })
}

export function useUserSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: queryKeys.friends.search(trimmed),
    queryFn: () => friendsApi.search(trimmed),
    // The API rejects anything shorter, so don't spend a request on it.
    enabled: trimmed.length >= 2,
    staleTime: 10_000,
  })
}

/** Every friend action can change the list and both request queues, so they all
 *  invalidate the same subtree rather than trying to patch individual caches. */
function useFriendMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.friends.all }),
  })
}

export function useSendFriendRequest() {
  return useFriendMutation((target: { user_id: string } | { email: string }) =>
    friendsApi.sendRequest(target),
  )
}

export function useAcceptFriendRequest() {
  return useFriendMutation((friendshipId: string) => friendsApi.accept(friendshipId))
}

export function useRejectFriendRequest() {
  return useFriendMutation((friendshipId: string) => friendsApi.reject(friendshipId))
}

export function useCancelFriendRequest() {
  return useFriendMutation((friendshipId: string) => friendsApi.cancel(friendshipId))
}

export function useRemoveFriend() {
  return useFriendMutation((userId: string) => friendsApi.remove(userId))
}
