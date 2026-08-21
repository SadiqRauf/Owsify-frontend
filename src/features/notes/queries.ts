import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-client'

import {
  noteApi,
  reminderApi,
  timelineApi,
  type NoteListParams,
  type ReminderInput,
  type ReminderListParams,
  type SubjectInput,
} from './api'

export function useNotes(params: NoteListParams = {}) {
  return useQuery({
    queryKey: queryKeys.notes.list(params),
    queryFn: () => noteApi.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useReminders(params: ReminderListParams = {}) {
  return useQuery({
    queryKey: queryKeys.reminders.list(params),
    queryFn: () => reminderApi.list(params),
    placeholderData: (previous) => previous,
  })
}

export function usePersonTimeline(personId: string | undefined, params: object = {}) {
  return useQuery({
    queryKey: queryKeys.people.timeline(personId ?? '', params),
    queryFn: () => timelineApi.forPerson(personId!, params),
    enabled: Boolean(personId),
    placeholderData: (previous) => previous,
  })
}

/**
 * Notes appear on their subject's page and on the person timeline, so a note
 * mutation makes both stale. The timeline lives under the people keys.
 */
function useNoteInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
    void queryClient.invalidateQueries({ queryKey: queryKeys.people.all })
  }
}

export function useCreateNote() {
  const invalidate = useNoteInvalidation()
  return useMutation({
    mutationFn: (input: SubjectInput & { body: string }) => noteApi.create(input),
    onSuccess: invalidate,
  })
}

export function useUpdateNote() {
  const invalidate = useNoteInvalidation()
  return useMutation({
    mutationFn: ({ noteId, body }: { noteId: string; body: string }) =>
      noteApi.update(noteId, body),
    onSuccess: invalidate,
  })
}

export function useDeleteNote() {
  const invalidate = useNoteInvalidation()
  return useMutation({
    mutationFn: (noteId: string) => noteApi.remove(noteId),
    onSuccess: invalidate,
  })
}

function useReminderInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all })
  }
}

export function useCreateReminder() {
  const invalidate = useReminderInvalidation()
  return useMutation({
    mutationFn: (input: ReminderInput) => reminderApi.create(input),
    onSuccess: invalidate,
  })
}

export function useUpdateReminder() {
  const invalidate = useReminderInvalidation()
  return useMutation({
    mutationFn: ({
      reminderId,
      input,
    }: {
      reminderId: string
      input: Partial<ReminderInput> & { completed?: boolean }
    }) => reminderApi.update(reminderId, input),
    onSuccess: invalidate,
  })
}

export function useDeleteReminder() {
  const invalidate = useReminderInvalidation()
  return useMutation({
    mutationFn: (reminderId: string) => reminderApi.remove(reminderId),
    onSuccess: invalidate,
  })
}
