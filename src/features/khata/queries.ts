import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-client'

import {
  khataApi,
  khataEntryApi,
  type KhataCreateInput,
  type KhataEntryCreateInput,
  type KhataEntryListParams,
  type KhataEntryUpdateInput,
  type KhataListParams,
  type KhataUpdateInput,
} from './api'

export function useKhatas(params: KhataListParams = {}) {
  return useQuery({
    queryKey: queryKeys.khata.list(params),
    queryFn: () => khataApi.list(params),
    // Keeps the list on screen while a search or page change loads, instead of
    // collapsing to a skeleton on every keystroke.
    placeholderData: (previous) => previous,
  })
}

export function useKhata(khataId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.khata.detail(khataId ?? ''),
    queryFn: () => khataApi.get(khataId!),
    enabled: Boolean(khataId),
  })
}

export function useCreateKhata() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: KhataCreateInput) => khataApi.create(input),
    onSuccess: (khata) => {
      queryClient.setQueryData(queryKeys.khata.detail(khata.id), khata)
      void queryClient.invalidateQueries({ queryKey: queryKeys.khata.all })
    },
  })
}

export function useUpdateKhata(khataId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: KhataUpdateInput) => khataApi.update(khataId, input),
    onSuccess: (khata) => {
      queryClient.setQueryData(queryKeys.khata.detail(khataId), khata)
      void queryClient.invalidateQueries({ queryKey: queryKeys.khata.lists })
    },
  })
}

export function useDeleteKhata() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ khataId, permanent }: { khataId: string; permanent?: boolean }) =>
      khataApi.remove(khataId, permanent),
    onSuccess: () => {
      // The detail entry is left to garbage collection rather than removed:
      // removing a query that still has an observer makes React Query refetch it,
      // which would ask for a khata that has just been deleted.
      void queryClient.invalidateQueries({ queryKey: queryKeys.khata.lists })
    },
  })
}

export function useKhataEntries(khataId: string | undefined, params: KhataEntryListParams = {}) {
  return useQuery({
    queryKey: queryKeys.khata.entries(khataId ?? '', params),
    queryFn: () => khataEntryApi.list(khataId!, params),
    enabled: Boolean(khataId),
    placeholderData: (previous) => previous,
  })
}

/**
 * Every entry mutation invalidates both the ledger and the khata itself.
 *
 * The khata's balance is derived from these rows on the server, so a changed entry
 * always changes the header figure too. Invalidating only the list would leave the
 * balance on screen contradicting the entries underneath it.
 */
function useEntryInvalidation(khataId: string) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.khata.entriesFor(khataId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.khata.detail(khataId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.khata.lists })
    // The person page adds this khata into its total, so it is stale now too.
    void queryClient.invalidateQueries({ queryKey: queryKeys.people.all })
  }
}

export function useCreateKhataEntry(khataId: string) {
  const invalidate = useEntryInvalidation(khataId)
  return useMutation({
    mutationFn: (input: KhataEntryCreateInput) => khataEntryApi.create(khataId, input),
    onSuccess: invalidate,
  })
}

export function useUpdateKhataEntry(khataId: string) {
  const invalidate = useEntryInvalidation(khataId)
  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: KhataEntryUpdateInput }) =>
      khataEntryApi.update(entryId, input),
    onSuccess: invalidate,
  })
}

export function useDeleteKhataEntry(khataId: string) {
  const invalidate = useEntryInvalidation(khataId)
  return useMutation({
    mutationFn: (entryId: string) => khataEntryApi.remove(entryId),
    onSuccess: invalidate,
  })
}
