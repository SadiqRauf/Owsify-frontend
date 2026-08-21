import { Search, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { usePeople } from '@/features/people/queries'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatAbsMoney, formatMoney, toCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { PersonListItem } from '@/types/api'

export function PeopleListPage() {
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search, 250)

  const { data, isLoading, isError, error, refetch } = usePeople(
    debounced ? { search: debounced } : {},
  )

  const people = data?.items ?? []

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">People</h1>
          <p className="mt-1 text-sm text-slate-500">
            Everyone you share money with, and what it comes to across groups and khatas.
          </p>
        </div>
      </header>

      <div className="relative max-w-sm">
        <Input
          label="Search people"
          placeholder="Name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-[2.35rem] size-4 text-slate-400"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-2 top-[2.1rem] rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>

      {isLoading && <CardSkeleton lines={6} />}

      {isError && (
        <ErrorState error={error} title="Could not load your people" onRetry={() => refetch()} />
      )}

      {data && people.length === 0 && (
        <EmptyState
          icon={Users}
          title={debounced ? 'Nobody matches that' : 'No shared money yet'}
          description={
            debounced
              ? 'Try a different name or email.'
              : 'Add someone to a group or open a khata for them, and they will appear here.'
          }
          action={
            debounced ? (
              <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      )}

      {people.length > 0 && (
        // min-w-0 for the same reason as the loan list: a grid item will not
        // shrink below its content's min-content width, and a long name beside a
        // nowrap balance then drags the whole page sideways on a phone.
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {people.map((person) => (
            <li key={person.id} className="min-w-0">
              <PersonRow person={person} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PersonRow({ person }: { person: PersonListItem }) {
  const cents = toCents(person.total_balance)
  const settled = cents === 0

  const body = (
    <Card className="h-full transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar name={person.name} src={person.avatar_url ?? undefined} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-slate-900">{person.name}</p>
            {/* Someone with no account has no person page, so the card says why
                and sends them to the khata instead of a dead link. */}
            {!person.has_account && <Badge tone="neutral">Khata only</Badge>}
          </div>
          {person.email && <p className="truncate text-sm text-slate-500">{person.email}</p>}
        </div>
        <div className="text-right">
          <p
            className={cn(
              'font-semibold tabular-nums',
              settled ? 'text-slate-500' : cents > 0 ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {settled
              ? formatMoney(0, person.currency)
              : formatAbsMoney(person.total_balance, person.currency)}
          </p>
          <p className="text-xs text-slate-500">
            {settled ? 'Settled up' : cents > 0 ? 'owes you' : 'you owe'}
          </p>
        </div>
      </div>
    </Card>
  )

  return person.has_account ? (
    <Link to={`/people/${person.id}`} className="block h-full">
      {body}
    </Link>
  ) : (
    <Link to={`/khata/${person.khata_id}`} className="block h-full">
      {body}
    </Link>
  )
}
