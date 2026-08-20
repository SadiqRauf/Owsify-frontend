import { apiClient } from '@/lib/api-client'
import type { PersonActivityPage, PersonListPage, PersonSummary } from '@/types/api'

export interface PeopleListParams {
  search?: string
  currency?: string
}

export const peopleApi = {
  async list(params: PeopleListParams = {}): Promise<PersonListPage> {
    const { data } = await apiClient.get<PersonListPage>('/people', { params })
    return data
  },

  async summary(personId: string, params: { currency?: string } = {}): Promise<PersonSummary> {
    const { data } = await apiClient.get<PersonSummary>(`/people/${personId}/summary`, { params })
    return data
  },

  async activity(
    personId: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<PersonActivityPage> {
    const { data } = await apiClient.get<PersonActivityPage>(`/people/${personId}/activity`, {
      params,
    })
    return data
  },
}
