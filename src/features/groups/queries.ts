import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-client'
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
      queryClient.removeQueries({ queryKey: queryKeys.groups.detail(groupId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list })
      // Deleting a group takes its expenses with it, so balances move too.
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
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
    onSuccess: () => {
      // Leaving your own group makes the detail query 404, so refetch rather than patch.
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
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
