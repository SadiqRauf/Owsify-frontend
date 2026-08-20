import { useState } from 'react'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { SERIES, SERIES_SOFT } from './tokens'

export interface BarDatum {
  key: string
  label: string
  value: number
  /** Optional leading glyph, e.g. a group emoji or a category icon. */
  glyph?: string
}

interface BarChartProps {
  data: BarDatum[]
  currency: string
  /** Cap the rows shown; the rest fold into an "Other" row rather than scrolling. */
  maxRows?: number
}

/**
 * Horizontal bars for magnitude by name.
 *
 * Horizontal because category and group names are long — rotated axis labels are
 * a readability tax paid on every read. One series, so one hue for every bar: a
 * ramp here would encode length twice and say nothing new.
 *
 * Built as a list rather than an SVG so the labels are real text: they wrap,
 * they are selectable, and they are read in order by a screen reader.
 */
export function BarChart({ data, currency, maxRows = 8 }: BarChartProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  // Past the cap, fold the tail into one row instead of generating more rows
  // than anyone reads.
  const shown = data.slice(0, maxRows)
  const tail = data.slice(maxRows)
  const rows =
    tail.length > 0
      ? [
          ...shown,
          {
            key: '__other__',
            label: `Other (${tail.length})`,
            value: tail.reduce((total, item) => total + item.value, 0),
          },
        ]
      : shown

  const max = Math.max(...rows.map((row) => row.value), 0) || 1

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => {
        const percent = (row.value / max) * 100
        const isHovered = hovered === row.key

        return (
          <li
            key={row.key}
            onMouseEnter={() => setHovered(row.key)}
            onMouseLeave={() => setHovered(null)}
            className="group"
          >
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-700">
                {row.glyph && <span aria-hidden>{row.glyph}</span>}
                <span className="truncate">{row.label}</span>
              </span>
              {/* Value labels live in text tokens; the coloured bar carries identity. */}
              <span className="shrink-0 tabular-nums font-medium text-slate-900">
                {formatMoney(row.value, currency)}
              </span>
            </div>

            {/* The track is the same hue at low opacity, so it reads as the
                bar's own scale rather than a second series. */}
            <div
              className="h-2.5 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: SERIES_SOFT }}
            >
              <div
                className={cn('h-full rounded-full transition-[width,opacity] duration-300')}
                style={{
                  width: `${Math.max(percent, row.value > 0 ? 2 : 0)}%`,
                  backgroundColor: SERIES,
                  opacity: hovered === null || isHovered ? 1 : 0.5,
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
