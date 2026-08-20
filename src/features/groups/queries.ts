import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { invalidateLedger, queryKeys } from '@/lib/query-client'
import type { GroupRole } from '@/types/api'

import { groupsApi, type GroupCreateInput, type GroupUpdateInput } from './api'

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.list,
    queryFn: groupsApi.list,
  })
}

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.detail(groupId ?? ''),
    queryFn: () => groupsApi.get(groupId!),
    enabled: Boolean(groupId),
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GroupCreateInput) => groupsApi.create(input),
    onSuccess: (group) => {
      queryClient.setQueryData(queryKeys.groups.detail(group.id), group)
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list })
    },
  })
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GroupUpdateInput) => groupsApi.update(groupId, input),
    onSuccess: (group) => {
      queryClient.setQueryData(queryKeys.groups.detail(groupId), group)
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.remove(groupId),
    onSuccess: (_result, groupId) => {
      // Deleting a group takes its expenses with it, so the whole ledger moves —
      // but nothing may refetch yet. This page is still mounted and its queries
      // are scoped to the group, so `/groups/{id}`, `/balances/groups/{id}` and
      // `/expenses?group_id={id}` would all come back 404.
      invalidateLedger(groupId, { refetch: false })

      // The group list is not group-scoped, so it is safe to refetch now.
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list })

      // Deliberately no removeQueries here. Removing a query that still has an
      // observer makes React Query treat it as a fresh mount and refetch it —
      // which is the 404 we are avoiding. This page unmounts a moment later and
      // garbage collection drops the entry.
    },
  })
}

export function useAddGroupMembers(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { user_ids?: string[]; emails?: string[] }) =>
      groupsApi.addMembers(groupId, input),
    onSuccess: (group) => {
      queryClient.setQueryData(queryKeys.groups.detail(groupId), group)
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list })
    },
  })
}

export function useRemoveGroupMember(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(groupId, userId),
    onSuccess: (_result, userId) => {
      const me = queryClient.getQueryData<{ id: string }>(queryKeys.auth.me)
      const iLeft = me?.id === userId

      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list })
      // Removing someone changes who owes what in this group — but if that
      // someone is me, I can no longer read any of it.
      invalidateLedger(groupId, { refetch: !iLeft })

      // Leaving means everything scoped to this group would 404 from here on.
      // The entry is left to garbage collection rather than removed: removing a
      // query that still has an observer makes React Query refetch it.
      if (!iLeft) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) })
      }
    },
  })
}

export function useSetMemberRole(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: GroupRole }) =>
      groupsApi.setRole(groupId, userId, role),
    onSuccess: (group) => queryClient.setQueryData(queryKeys.groups.detail(groupId), group),
  })
}
