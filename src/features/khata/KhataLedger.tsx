import { ArrowDownLeft, ArrowUpRight, BookOpen, Pencil, Plus, Scale, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CardSkeleton } from '@/components/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatAbsMoney, formatMoney, toCents } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import type { KhataEntry, KhataEntryType } from '@/types/api'

import { KhataEntryModal } from './KhataEntryModal'
import { useDeleteKhataEntry, useKhataEntries } from './queries'

const PAGE_SIZE = 20

const TYPE_META: Record<
  KhataEntryType,
  { label: string; icon: typeof ArrowUpRight; className: string }
> = {
  given: { label: 'Given', icon: ArrowUpRight, className: 'bg-emerald-50 text-emerald-700' },
  received: { label: 'Received', icon: ArrowDownLeft, className: 'bg-sky-50 text-sky-700' },
  adjustment: { label: 'Adjustment', icon: Scale, className: 'bg-amber-50 text-amber-700' },
}

interface KhataLedgerProps {
  khataId: string
  currency: string
  personName: string
}

export function KhataLedger({ khataId, currency, personName }: KhataLedgerProps) {
  const [entryType, setEntryType] = useState<'' | KhataEntryType>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(0)

  const [isAddOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<KhataEntry | null>(null)
  const [deleting, setDeleting] = useState<KhataEntry | null>(null)

  const deleteEntry = useDeleteKhataEntry(khataId)

  const isFiltered = Boolean(entryType || startDate || endDate)

  const { data, isLoading, isError, error, refetch } = useKhataEntries(khataId, {
    ...(entryType ? { entry_type: entryType } : {}),
    ...(startDate ? { start_date: startDate } : {}),
    ...(endDate ? { end_date: endDate } : {}),
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  // Any filter change re-pages from the start: staying on page 3 of a result set
  // that now has one page shows an empty table that looks like a bug.
  const changeFilter = (apply: () => void) => {
    apply()
    setPage(0)
  }

  const clearFilters = () =>
    changeFilter(() => {
      setEntryType('')
      setStartDate('')
      setEndDate('')
    })

  const entries = data?.items ?? []
  const total = data?.total ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  return (
    <>
      <Card
        title="Ledger"
        description="Every amount given and received, newest first. The balance is the sum of these lines."
        action={
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            leftIcon={<Plus className="size-4" />}
            className="whitespace-nowrap"
          >
            Add entry
          </Button>
        }
      >
        {/* Filters sit in one row above the ledger, so the controls and the thing
            they control are never separated by the results. */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Type"
            value={entryType}
            onChange={(event) =>
              changeFilter(() => setEntryType(event.target.value as '' | KhataEntryType))
            }
            options={[
              { value: '', label: 'All entries' },
              { value: 'given', label: 'Given' },
              { value: 'received', label: 'Received' },
              { value: 'adjustment', label: 'Adjustments' },
            ]}
          />
          <Input
            label="From"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => changeFilter(() => setStartDate(event.target.value))}
          />
          <Input
            label="To"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => changeFilter(() => setEndDate(event.target.value))}
          />
          <div className="flex items-end">
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                leftIcon={<X className="size-4" />}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* The totals describe the khata, not the filtered page. A filtered view
            must never make a khata look settled when it is not. */}
        {data && (
          <dl className="mb-4 grid gap-3 sm:grid-cols-4">
            <Total label="Given" value={data.totals.given} currency={currency} />
            <Total label="Received" value={data.totals.received} currency={currency} />
            <Total label="Adjustments" value={data.totals.adjustment} currency={currency} />
            <Total label="Balance" value={data.balance} currency={currency} emphasise />
          </dl>
        )}

        {isLoading && <CardSkeleton lines={5} />}

        {isError && (
          <ErrorState error={error} title="Could not load the ledger" onRetry={() => refetch()} />
        )}

        {data && entries.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title={isFiltered ? 'No entries match these filters' : 'No entries yet'}
            description={
              isFiltered
                ? 'Try a wider date range, or clear the filters to see the whole ledger.'
                : `Record what you give ${personName} and what they pay back. The balance follows from these lines.`
            }
            action={
              isFiltered ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  Add the first entry
                </Button>
              )
            }
          />
        )}

        {data && entries.length > 0 && (
          /* The table scrolls inside its own box.
             `relative` is load-bearing, not decoration: the sr-only caption and
             column labels are absolutely positioned, and an absolutely positioned
             element is only clipped by an ancestor that is its containing block.
             Without it they escape the scroll box at the table's full width and
             the whole page scrolls sideways on a phone. */
          <div className="relative max-w-full overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">
                {personName}&rsquo;s khata: every entry with the balance after it.
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-2">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Entry
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Balance after
                  </th>
                  <th scope="col" className="px-4 py-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    currency={currency}
                    onEdit={() => setEditing(entry)}
                    onDelete={() => setDeleting(entry)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              {page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= lastPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <KhataEntryModal
        isOpen={isAddOpen}
        onClose={() => setAddOpen(false)}
        khataId={khataId}
        currency={currency}
      />

      <KhataEntryModal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        khataId={khataId}
        currency={currency}
        entry={editing ?? undefined}
      />

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await deleteEntry.mutateAsync(deleting.id)
        }}
        title="Delete this entry"
        description={
          deleting
            ? `Removing ${formatAbsMoney(deleting.amount, currency)} from ${formatDate(
                deleting.entry_date,
              )} changes the balance, because the balance is only ever the sum of these lines.`
            : ''
        }
        confirmLabel="Delete entry"
      />
    </>
  )
}

function Total({
  label,
  value,
  currency,
  emphasise,
}: {
  label: string
  value: string
  currency: string
  emphasise?: boolean
}) {
  const cents = toCents(value)
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 text-base font-semibold tabular-nums',
          !emphasise && 'text-slate-900',
          emphasise && (cents > 0 ? 'text-emerald-600' : cents < 0 ? 'text-red-600' : 'text-slate-900'),
        )}
      >
        {formatMoney(value, currency)}
      </dd>
    </div>
  )
}

function EntryRow({
  entry,
  currency,
  onEdit,
  onDelete,
}: {
  entry: KhataEntry
  currency: string
  onEdit: () => void
  onDelete: () => void
}) {
  const meta = TYPE_META[entry.entry_type]
  const Icon = meta.icon
  const impact = toCents(entry.signed_amount)
  const running = toCents(entry.running_balance)

  return (
    <tr className="group hover:bg-slate-50">
      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(entry.entry_date)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('rounded-md p-1', meta.className)}>
            <Icon aria-hidden className="size-3.5" />
          </span>
          <div className="min-w-0">
            <span className="font-medium text-slate-900">{meta.label}</span>
            {entry.description && (
              <span className="ml-2 text-slate-500">{entry.description}</span>
            )}
          </div>
        </div>
      </td>
      <td
        className={cn(
          'whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums',
          impact > 0 ? 'text-emerald-600' : 'text-red-600',
        )}
      >
        {impact > 0 ? '+' : '−'}
        {formatAbsMoney(entry.signed_amount, currency)}
      </td>
      <td
        className={cn(
          'whitespace-nowrap px-4 py-3 text-right tabular-nums',
          running === 0 ? 'text-slate-500' : 'text-slate-900',
        )}
      >
        {formatMoney(entry.running_balance, currency)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        {/* Visible on focus as well as hover, so the row is reachable by keyboard. */}
        <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit the entry from ${formatDate(entry.entry_date)}`}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 focus-visible:opacity-100"
          >
            <Pencil aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete the entry from ${formatDate(entry.entry_date)}`}
            className="rounded-md p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-700"
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
