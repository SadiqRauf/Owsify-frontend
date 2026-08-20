import { Check, Clock, Mail, Search, Send, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Spinner } from '@/components/feedback/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { getErrorMessage, isApiError } from '@/lib/api-client'
import type { Invitation, RelationshipLabel, UserSearchResult } from '@/types/api'

import { useSendFriendRequest, useSendInvitation, useUserSearch } from './queries'

/** Waits for typing to settle so a search fires per pause, not per keystroke. */
function useDebounced(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/** Deliberately permissive: the backend is the authority on what is deliverable. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

const RELATIONSHIP_BADGE: Partial<Record<RelationshipLabel, { label: string; icon: typeof Check }>> =
  {
    friends: { label: 'Friends', icon: Check },
    request_sent: { label: 'Request sent', icon: Clock },
    request_received: { label: 'Wants to be friends', icon: Clock },
  }

function ResultRow({ result }: { result: UserSearchResult }) {
  const sendRequest = useSendFriendRequest()
  const badge = RELATIONSHIP_BADGE[result.relationship]

  return (
    <li className="flex items-center gap-3 py-2.5">
      <Avatar name={result.full_name} src={result.avatar_url} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{result.full_name}</p>
        <p className="truncate text-xs text-slate-500">{result.email}</p>
      </div>

      {badge ? (
        <Badge tone={result.relationship === 'friends' ? 'success' : 'neutral'}>
          <badge.icon aria-hidden className="mr-1 size-3" />
          {badge.label}
        </Badge>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          isLoading={sendRequest.isPending}
          onClick={() => sendRequest.mutate({ user_id: result.id })}
          leftIcon={<UserPlus className="size-4" />}
        >
          Add
        </Button>
      )}
    </li>
  )
}

/**
 * Shown when nobody matches. If the search term is an email address we can invite
 * it directly; otherwise we ask for one, because an invitation needs somewhere to go.
 */
function InvitePanel({ term }: { term: string }) {
  const sendInvitation = useSendInvitation()
  const sendRequest = useSendFriendRequest()

  // Derived rather than synced: the field follows the search box until the user
  // edits it, after which their own value wins. No effect, so no cascading render.
  const [typedEmail, setTypedEmail] = useState<string | null>(null)
  const email = typedEmail ?? (looksLikeEmail(term) ? term.trim() : '')

  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<Invitation | null>(null)

  const handleInvite = async () => {
    const address = email.trim()
    setError(null)

    if (!looksLikeEmail(address)) {
      setError('Enter a valid email address to send an invitation.')
      return
    }

    try {
      const invitation = await sendInvitation.mutateAsync({
        email: address,
        message: message.trim() || null,
      })
      setSent(invitation)
      setMessage('')
    } catch (caught) {
      // They signed up between the search and the invite: send a friend request
      // instead of making the user work it out.
      if (
        isApiError(caught) &&
        caught.details.some((detail) => detail.type === 'account_exists')
      ) {
        try {
          await sendRequest.mutateAsync({ email: address })
          setSent({ email: address, delivery: 'email' } as Invitation)
          return
        } catch (requestError) {
          setError(getErrorMessage(requestError))
          return
        }
      }
      setError(getErrorMessage(caught))
    }
  }

  if (sent) {
    // Never claim an email was sent when the server is only logging it — a
    // stubbed mail backend that looks like success is exactly how you end up
    // waiting for a message that was never going to arrive.
    if (sent.delivery !== 'email') {
      return (
        <Alert tone="info" title="Invitation created, but not emailed">
          The invite for <strong>{sent.email}</strong> is valid and will connect you as soon
          as they sign up — but this server has email delivery set to{' '}
          <code>{sent.delivery}</code>, so nothing was sent. The link is in the{' '}
          {sent.delivery === 'console' ? 'backend log' : 'configured file directory'}.
        </Alert>
      )
    }

    return (
      <Alert tone="success" title="Invitation sent">
        We emailed <strong>{sent.email}</strong>. They will be added to your friends
        automatically once they create an account.
      </Alert>
    )
  }

  return (
    <div className="space-y-3 rounded-lg bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
          <Mail aria-hidden className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">Not on Owsify yet?</p>
          <p className="mt-0.5 text-sm text-slate-500">
            Send them an email invitation. You will be connected as soon as they sign up.
          </p>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="space-y-1.5">
        <label htmlFor="invite-email" className="block text-sm font-medium text-slate-700">
          Email address
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(event) => setTypedEmail(event.target.value)}
          placeholder="them@example.com"
          className="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-500"
        />
      </div>

      <Textarea
        label="Add a note (optional)"
        rows={2}
        maxLength={500}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Hey, let's use this to sort out the trip costs"
      />

      <Button
        onClick={handleInvite}
        isLoading={sendInvitation.isPending || sendRequest.isPending}
        leftIcon={<Send className="size-4" />}
      >
        Send invitation
      </Button>
    </div>
  )
}

export function UserSearch() {
  const [term, setTerm] = useState('')
  const debounced = useDebounced(term)
  const { data, isFetching, isLoading, isError, error } = useUserSearch(debounced)

  const trimmed = debounced.trim()
  const isTooShort = trimmed.length > 0 && trimmed.length < 2
  // Gated on isLoading, not isFetching: a background revalidation must not
  // unmount the invite panel and throw away what the user has typed into it.
  const noMatches = Boolean(data) && data!.length === 0 && !isLoading && trimmed.length >= 2

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search for people"
          className="block w-full rounded-lg border-0 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-500"
        />
        {isFetching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </span>
        )}
      </div>

      {isTooShort && <p className="text-sm text-slate-500">Type at least 2 characters.</p>}

      {isError && <Alert tone="error">{getErrorMessage(error)}</Alert>}

      {data && data.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {data.map((result) => (
            <ResultRow key={result.id} result={result} />
          ))}
        </ul>
      )}

      {noMatches && (
        <>
          <p className="text-sm text-slate-500">
            Nobody on Owsify matches “{trimmed}”.
          </p>
          <InvitePanel term={trimmed} />
        </>
      )}
    </div>
  )
}
