import { BookUser, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Spinner } from '@/components/feedback/Spinner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { KhataCard } from '@/features/khata/KhataCard'
import { KhataFormModal } from '@/features/khata/KhataFormModal'
import { useKhatas } from '@/features/khata/queries'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatAbsMoney, formatMoney, toCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Khata } from '@/types/api'

const PAGE_SIZE = 50

export function KhataListPage() {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [isFormOpen, setFormOpen] = useState(false)

  const search = useDebouncedValue(term).trim()

  const { data, isLoading, isFetching, isError, error, refetch, isPlaceholderData } = useKhatas({
    search: search || undefined,
    include_archived: includeArchived || undefined,
    limit: PAGE_SIZE,
  })

  const items = data?.items ?? []
  const totals = data?.totals ?? []
  const isSearching = search.length > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Khata</h1>
          <p className="mt-1 text-sm text-slate-500">
            A running book for each person you deal with.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} leftIcon={<Plus className="size-4" />}>
          Add Khata
        </Button>
      </header>

      {/* Per-currency totals: a khata in rupees and one in dollars cannot be
          summed into a single figure without inventing a number. */}
      {totals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {totals.map((row) => {
            const net = toCents(row.net)
            return (
              <div
                key={row.currency}
                className="rounded-card bg-white p-5 shadow-sm ring-1 ring-slate-200/70"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-slate-500">
                    Net in {row.currency}
                  </p>
                  <p className="text-xs text-slate-400">
                    {row.khata_count} khata{row.khata_count === 1 ? '' : 's'}
                  </p>
                </div>
                <p
                  className={cn(
                    'mt-2 text-2xl font-semibold tabular-nums',
                    net > 0 ? 'text-emerald-600' : net < 0 ? 'text-red-600' : 'text-slate-900',
                  )}
                >
                  {formatMoney(row.net, row.currency)}
                </p>
                <dl className="mt-3 flex gap-4 text-xs">
                  <div>
                    <dt className="text-slate-400">You are owed</dt>
                    <dd className="font-medium tabular-nums text-emerald-600">
                      {formatAbsMoney(row.owed_to_you, row.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">You owe</dt>
                    <dd className="font-medium tabular-nums text-red-600">
                      {formatAbsMoney(row.you_owe, row.currency)}
                    </dd>
                  </div>
                </dl>
              </div>
            )
          })}
        </div>
      )}

      {/* Search and filter sit above the list they govern. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search by name, phone or email"
            aria-label="Search khatas"
            className="block w-full rounded-lg border-0 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-500"
          />
          {isSearching && isFetching ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner size="sm" />
            </span>
          ) : (
            term && (
              <button
                type="button"
                onClick={() => setTerm('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X aria-hidden className="size-4" />
              </button>
            )
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
            className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Show archived
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton lines={1} />
          <CardSkeleton lines={1} />
          <CardSkeleton lines={1} />
        </div>
      ) : isError ? (
        <ErrorState error={error} title="Could not load your khatas" onRetry={() => refetch()} />
      ) : items.length > 0 ? (
        <ul className={cn('space-y-3', isPlaceholderData && 'opacity-60 transition-opacity')}>
          {items.map((khata) => (
            <KhataCard key={khata.id} khata={khata} />
          ))}
        </ul>
      ) : isSearching ? (
        // A search with no hits is a different situation from having no khatas at
        // all, and offering "add your first" here would be the wrong suggestion.
        <Card>
          <EmptyState
            icon={Search}
            title={`Nothing matches “${search}”`}
            description="Try a different name, phone number or email."
            action={
              <Button variant="secondary" onClick={() => setTerm('')}>
                Clear search
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={BookUser}
            title="No khatas yet"
            description="Open a khata for anyone you lend to or borrow from — they do not need an Owsify account."
            action={
              <Button onClick={() => setFormOpen(true)} leftIcon={<Plus className="size-4" />}>
                Add your first Khata
              </Button>
            }
          />
        </Card>
      )}

      <KhataFormModal
        isOpen={isFormOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(khata: Khata) => navigate(`/khata/${khata.id}`)}
      />
    </div>
  )
}
