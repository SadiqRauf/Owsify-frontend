import { Check, Clock, Search, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Spinner } from '@/components/feedback/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/lib/api-client'
import type { RelationshipLabel, UserSearchResult } from '@/types/api'

import { useSendFriendRequest, useUserSearch } from './queries'

/** Waits for typing to settle so a search fires per pause, not per keystroke. */
function useDebounced(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
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

export function UserSearch() {
  const [term, setTerm] = useState('')
  const debounced = useDebounced(term)
  const { data, isFetching, isError, error } = useUserSearch(debounced)

  const isTooShort = debounced.trim().length > 0 && debounced.trim().length < 2

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

      {data && data.length === 0 && !isFetching && (
        <p className="text-sm text-slate-500">
          Nobody matches “{debounced.trim()}”. They may need an account first.
        </p>
      )}

      {data && data.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {data.map((result) => (
            <ResultRow key={result.id} result={result} />
          ))}
        </ul>
      )}
    </div>
  )
}
