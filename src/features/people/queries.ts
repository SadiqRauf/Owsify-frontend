import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-client'

import { peopleApi, type PeopleListParams } from './api'

export function usePeople(params: PeopleListParams = {}) {
  return useQuery({
    queryKey: queryKeys.people.list(params),
    queryFn: () => peopleApi.list(params),
    placeholderData: (previous) => previous,
  })
}

export function usePersonSummary(personId: string | undefined, currency?: string) {
  return useQuery({
    queryKey: queryKeys.people.summary(personId ?? '', { currency }),
    queryFn: () => peopleApi.summary(personId!, currency ? { currency } : {}),
    enabled: Boolean(personId),
  })
}

export function usePersonActivity(
  personId: string | undefined,
  params: { limit?: number; offset?: number } = {},
) {
  return useQuery({
    queryKey: queryKeys.people.activity(personId ?? '', params),
    queryFn: () => peopleApi.activity(personId!, params),
    enabled: Boolean(personId),
    placeholderData: (previous) => previous,
  })
}
