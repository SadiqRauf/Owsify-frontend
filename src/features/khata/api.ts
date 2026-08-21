import { apiClient } from '@/lib/api-client'
import type {
  Khata,
  KhataEntry,
  KhataEntryListPage,
  KhataEntryType,
  KhataListPage,
  MessageResponse,
} from '@/types/api'

export interface KhataCreateInput {
  person_name: string
  person_phone?: string | null
  person_email?: string | null
  person_user_id?: string | null
  currency?: string
  notes?: string | null
}

export type KhataUpdateInput = Partial<KhataCreateInput> & { is_archived?: boolean }

export interface KhataListParams {
  search?: string
  include_archived?: boolean
  sort?: string
  limit?: number
  offset?: number
}

export const khataApi = {
  async list(params: KhataListParams = {}): Promise<KhataListPage> {
    const { data } = await apiClient.get<KhataListPage>('/khata', { params })
    return data
  },

  async get(khataId: string): Promise<Khata> {
    const { data } = await apiClient.get<Khata>(`/khata/${khataId}`)
    return data
  },

  async create(input: KhataCreateInput): Promise<Khata> {
    const { data } = await apiClient.post<Khata>('/khata', input)
    return data
  },

  async update(khataId: string, input: KhataUpdateInput): Promise<Khata> {
    const { data } = await apiClient.patch<Khata>(`/khata/${khataId}`, input)
    return data
  },

  /** Archives by default; `permanent` destroys the ledger and its entries. */
  async remove(khataId: string, permanent = false): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(`/khata/${khataId}`, {
      params: permanent ? { permanent: true } : undefined,
    })
    return data
  },
}

export interface KhataEntryCreateInput {
  entry_type: KhataEntryType
  amount: string
  entry_date: string
  description?: string | null
}

export type KhataEntryUpdateInput = Partial<KhataEntryCreateInput>

export interface KhataEntryListParams {
  entry_type?: KhataEntryType
  start_date?: string
  end_date?: string
  search?: string
  limit?: number
  offset?: number
}

export const khataEntryApi = {
  async list(khataId: string, params: KhataEntryListParams = {}): Promise<KhataEntryListPage> {
    const { data } = await apiClient.get<KhataEntryListPage>(`/khata/${khataId}/entries`, {
      params,
    })
    return data
  },

  async create(khataId: string, input: KhataEntryCreateInput): Promise<KhataEntry> {
    const { data } = await apiClient.post<KhataEntry>(`/khata/${khataId}/entries`, input)
    return data
  },

  // Entries are addressed directly once they exist, so editing and deleting do not
  // need the khata id — the server resolves it and checks ownership through it.
  async update(entryId: string, input: KhataEntryUpdateInput): Promise<KhataEntry> {
    const { data } = await apiClient.patch<KhataEntry>(`/khata/entries/${entryId}`, input)
    return data
  },

  async remove(entryId: string): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(`/khata/entries/${entryId}`)
    return data
  },
}
