import { Check, Pencil, Plus, StickyNote, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Textarea } from '@/components/ui/Textarea'
import { formatDate } from '@/lib/utils'
import type { Note } from '@/types/api'

import type { SubjectInput } from './api'
import { useCreateNote, useDeleteNote, useNotes, useUpdateNote } from './queries'

/**
 * Notes for one subject, added and edited inline.
 *
 * Inline rather than in a modal: a note is a sentence, and pushing a dialog in
 * front of one sentence costs more attention than it saves.
 */
export function NotesSection({
  subject,
  title = 'Notes',
  description,
}: {
  subject: SubjectInput
  title?: string
  description?: string
}) {
  const { data, isLoading } = useNotes({ ...subject, limit: 50 })
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()

  const [isAdding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [deleting, setDeleting] = useState<Note | null>(null)

  const notes = data?.items ?? []

  const submitNew = async () => {
    const body = draft.trim()
    if (!body) return
    await createNote.mutateAsync({ ...subject, body })
    setDraft('')
    setAdding(false)
  }

  const submitEdit = async () => {
    const body = editDraft.trim()
    if (!body || !editingId) return
    await updateNote.mutateAsync({ noteId: editingId, body })
    setEditingId(null)
  }

  return (
    <>
      <Card
        title={title}
        description={description ?? 'What was agreed, and anything worth remembering.'}
        action={
          !isAdding ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAdding(true)}
              leftIcon={<Plus className="size-4" />}
              className="whitespace-nowrap"
            >
              Add note
            </Button>
          ) : undefined
        }
      >
        {isAdding && (
          <div className="mb-4">
            <Textarea
              label="New note"
              placeholder="Will return by September"
              rows={2}
              value={draft}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={submitNew} isLoading={createNote.isPending}>
                Save note
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false)
                  setDraft('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!isLoading && notes.length === 0 && !isAdding && (
          <EmptyState
            icon={StickyNote}
            title="No notes yet"
            description="A note is the context a number cannot carry — what was agreed, and when."
            action={
              <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
                Add the first note
              </Button>
            }
          />
        )}

        {notes.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {notes.map((note) => (
              <li key={note.id} className="group py-3 first:pt-0 last:pb-0">
                {editingId === note.id ? (
                  <div>
                    <Textarea
                      label="Edit note"
                      rows={2}
                      value={editDraft}
                      autoFocus
                      onChange={(event) => setEditDraft(event.target.value)}
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={submitEdit}
                        isLoading={updateNote.isPending}
                        leftIcon={<Check className="size-4" />}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        leftIcon={<X className="size-4" />}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap text-sm text-slate-800">{note.body}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(note.created_at)}
                        {note.updated_at !== note.created_at && ' · edited'}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(note.id)
                          setEditDraft(note.body)
                        }}
                        aria-label="Edit this note"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                      >
                        <Pencil aria-hidden className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(note)}
                        aria-label="Delete this note"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await deleteNote.mutateAsync(deleting.id)
        }}
        title="Delete this note"
        description="The note will be removed from this page and from the timeline."
        confirmLabel="Delete note"
      />
    </>
  )
}
