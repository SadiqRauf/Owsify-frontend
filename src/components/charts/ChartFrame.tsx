import { Table2 } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ChartFrameProps {
  title: string
  subtitle?: string
  /** Spoken description of the whole chart, for screen readers. */
  summary: string
  /** Rendered when the reader switches to the table. Never gated behind hover. */
  table: ReactNode
  isEmpty?: boolean
  emptyMessage?: string
  children: ReactNode
  action?: ReactNode
}

/**
 * Shared chrome for every chart: heading, a table view, and the empty state.
 *
 * The table is not a fallback — it is the same data in a form that copies, reads
 * aloud, and works without a pointer. Anything only discoverable by hovering is
 * unavailable to a lot of people.
 */
export function ChartFrame({
  title,
  subtitle,
  summary,
  table,
  isEmpty = false,
  emptyMessage = 'No data for this period.',
  children,
  action,
}: ChartFrameProps) {
  const [showTable, setShowTable] = useState(false)
  const regionId = useId()

  return (
    <section
      aria-labelledby={`${regionId}-title`}
      className="rounded-card bg-white p-5 shadow-sm ring-1 ring-slate-200/70"
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`${regionId}-title`} className="text-base font-semibold text-slate-900">
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {action}
          {!isEmpty && (
            <button
              type="button"
              onClick={() => setShowTable((current) => !current)}
              aria-pressed={showTable}
              aria-controls={`${regionId}-body`}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                showTable
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
              )}
              title={showTable ? 'Show chart' : 'Show as table'}
            >
              <Table2 aria-hidden className="size-4" />
              <span className="sr-only">{showTable ? 'Show chart' : 'Show as table'}</span>
            </button>
          )}
        </div>
      </header>

      <div id={`${regionId}-body`}>
        {isEmpty ? (
          <p className="py-8 text-center text-sm text-slate-400">{emptyMessage}</p>
        ) : showTable ? (
          <div className="overflow-x-auto">{table}</div>
        ) : (
          <>
            <p className="sr-only">{summary}</p>
            {children}
          </>
        )}
      </div>
    </section>
  )
}

/** Consistent table styling for every chart's table view. */
export function ChartTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: Array<Array<string | number>>
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          {columns.map((column, index) => (
            <th
              key={column}
              scope="col"
              className={cn(
                'pb-2 font-medium text-slate-500',
                index === 0 ? 'text-left' : 'text-right',
              )}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-b border-slate-100 last:border-0">
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className={cn(
                  'py-2',
                  cellIndex === 0
                    ? 'text-left text-slate-900'
                    : 'text-right tabular-nums text-slate-600',
                )}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
