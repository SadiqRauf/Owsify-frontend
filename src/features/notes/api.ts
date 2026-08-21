import { apiClient } from '@/lib/api-client'
import type {
  MessageResponse,
  Note,
  NoteListPage,
  NoteSubject,
  Reminder,
  ReminderListPage,
  ReminderStatus,
  TimelinePage,
} from '@/types/api'

/** Exactly one of these identifies what a note or reminder is about. */
export interface SubjectInput {
  khata_id?: string | null
  loan_id?: string | null
  person_user_id?: string | null
}

export interface NoteListParams extends SubjectInput {
  subject?: NoteSubject
  search?: string
  limit?: number
  offset?: number
}

export interface ReminderListParams extends SubjectInput {
  status?: ReminderStatus
  subject?: NoteSubject
  surfaced_only?: boolean
  include_completed?: boolean
  limit?: number
  offset?: number
}

export interface ReminderInput extends SubjectInput {
  title: string
  notes?: string | null
  due_date: string
  remind_on?: string | null
  amount?: string | null
  currency?: string | null
}

export const noteApi = {
  async list(params: NoteListParams = {}): Promise<NoteListPage> {
    const { data } = await apiClient.get<NoteListPage>('/notes', { params })
    return data
  },

  async create(input: SubjectInput & { body: string }): Promise<Note> {
    const { data } = await apiClient.post<Note>('/notes', input)
    return data
  },

  async update(noteId: string, body: string): Promise<Note> {
    const { data } = await apiClient.patch<Note>(`/notes/${noteId}`, { body })
    return data
  },

  async remove(noteId: string): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(`/notes/${noteId}`)
    return data
  },
}

export const reminderApi = {
  async list(params: ReminderListParams = {}): Promise<ReminderListPage> {
    const { data } = await apiClient.get<ReminderListPage>('/reminders', { params })
    return data
  },

  async create(input: ReminderInput): Promise<Reminder> {
    const { data } = await apiClient.post<Reminder>('/reminders', input)
    return data
  },

  async update(reminderId: string, input: Partial<ReminderInput> & { completed?: boolean }) {
    const { data } = await apiClient.patch<Reminder>(`/reminders/${reminderId}`, input)
    return data
  },

  async remove(reminderId: string): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(`/reminders/${reminderId}`)
    return data
  },
}

export const timelineApi = {
  async forPerson(
    personId: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<TimelinePage> {
    const { data } = await apiClient.get<TimelinePage>(`/people/${personId}/timeline`, { params })
    return data
  },
}
