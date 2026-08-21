import { useId, useMemo, useState } from 'react'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import {
  AXIS_INK,
  BAR_RADIUS,
  GRID,
  MAX_BAR_THICKNESS,
  SERIES_PAIR,
  SURFACE_GAP,
} from './tokens'
import { useElementWidth } from './useElementWidth'

export interface GroupedDatum {
  label: string
  shortLabel: string
  /** One value per series, in the same order as `series`. */
  values: number[]
}

interface GroupedColumnChartProps {
  data: GroupedDatum[]
  /** Two series. A third would need the palette re-validated. */
  series: [string, string]
  currency: string
}

function niceTicks(max: number, count = 3): number[] {
  if (max <= 0) return [0]
  const rough = max / count
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? magnitude * 10
  const ticks: number[] = []
  for (let value = 0; value <= max + step / 2; value += step) ticks.push(value)
  return ticks
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}m`
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k`
  return String(value)
}

/**
 * Two series side by side, over time.
 *
 * A legend is always present because two series mean colour is carrying identity,
 * and identity must never be colour-alone — so the legend names both, and the
 * table view underneath carries the same numbers for anyone who cannot use the
 * chart at all.
 *
 * Drawn at the container's real pixel size rather than in a scaled viewBox, for the
 * same reason as the single-series chart: a scaled viewBox stretches 11px labels
 * and 1px hairlines along with the container.
 */
export function GroupedColumnChart({ data, series, currency }: GroupedColumnChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>()
  const [hovered, setHovered] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)
  const titleId = useId()

  const height = 240
  const padding = { top: 16, right: 8, bottom: 28, left: 44 }

  const max = useMemo(
    () => Math.max(0, ...data.flatMap((datum) => datum.values)),
    [data],
  )
  const ticks = useMemo(() => niceTicks(max), [max])
  const scaleMax = ticks[ticks.length - 1] || 1

  const plotWidth = Math.max(0, width - padding.left - padding.right)
  const plotHeight = height - padding.top - padding.bottom
  const slot = data.length > 0 ? plotWidth / data.length : 0

  // Two bars per slot, with a surface gap between them and air on both sides.
  const barThickness = Math.max(
    2,
    Math.min(MAX_BAR_THICKNESS, (slot - SURFACE_GAP) / 2 - 4),
  )
  const groupWidth = barThickness * 2 + SURFACE_GAP

  // Thin the axis labels out rather than letting them collide.
  const stride = Math.max(1, Math.ceil((data.length * 44) / Math.max(plotWidth, 1)))

  const y = (value: number) => padding.top + plotHeight - (value / scaleMax) * plotHeight

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {/* Always present for two series: identity is never colour-alone. */}
        <ul className="flex flex-wrap gap-4">
          {series.map((name, index) => (
            <li key={name} className="flex items-center gap-1.5 text-sm text-slate-600">
              <span
                aria-hidden
                className="size-2.5 rounded-sm"
                style={{ background: SERIES_PAIR[index] }}
              />
              {name}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setShowTable((current) => !current)}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {showTable ? 'Show chart' : 'Show as table'}
        </button>
      </div>

      {showTable ? (
        <div className="relative max-w-full overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <caption className="sr-only">
              {series[0]} and {series[1]} per period.
            </caption>
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-4">
                  Period
                </th>
                {series.map((name) => (
                  <th key={name} scope="col" className="py-2 pr-4 text-right">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((datum) => (
                <tr key={datum.label}>
                  <th scope="row" className="py-2 pr-4 text-left font-normal text-slate-600">
                    {datum.label}
                  </th>
                  {datum.values.map((value, index) => (
                    <td
                      key={index}
                      className="py-2 pr-4 text-right tabular-nums text-slate-900"
                    >
                      {formatMoney(value, currency)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="w-full">
          {width > 0 && (
            <svg
              width={width}
              height={height}
              role="img"
              aria-labelledby={titleId}
              data-chart="grouped-column"
              onMouseLeave={() => setHovered(null)}
            >
              <title id={titleId}>
                {series[0]} against {series[1]}, per period, in {currency}.
              </title>

              {ticks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke={GRID}
                    strokeWidth={1}
                  />
                  <text
                    x={padding.left - 8}
                    y={y(tick) + 4}
                    textAnchor="end"
                    fontSize={11}
                    fill={AXIS_INK}
                  >
                    {compact(tick)}
                  </text>
                </g>
              ))}

              {data.map((datum, index) => {
                const slotStart = padding.left + index * slot
                const groupStart = slotStart + (slot - groupWidth) / 2
                const isHovered = hovered === index

                return (
                  <g
                    key={datum.label}
                    onMouseEnter={() => setHovered(index)}
                  >
                    {/* A full-height hit target, so the pointer does not have to
                        find a 6px bar. */}
                    <rect
                      x={slotStart}
                      y={padding.top}
                      width={slot}
                      height={plotHeight}
                      fill={isHovered ? '#f8fafc' : 'transparent'}
                    />

                    {datum.values.map((value, seriesIndex) => {
                      const barHeight = Math.max(
                        value > 0 ? 2 : 1,
                        (value / scaleMax) * plotHeight,
                      )
                      return (
                        <rect
                          key={seriesIndex}
                          x={groupStart + seriesIndex * (barThickness + SURFACE_GAP)}
                          y={padding.top + plotHeight - barHeight}
                          width={barThickness}
                          height={barHeight}
                          rx={BAR_RADIUS}
                          fill={SERIES_PAIR[seriesIndex]}
                          opacity={value > 0 ? 1 : 0.25}
                        />
                      )
                    })}

                    {index % stride === 0 && (
                      <text
                        x={slotStart + slot / 2}
                        y={height - 8}
                        textAnchor="middle"
                        fontSize={11}
                        fill={AXIS_INK}
                      >
                        {datum.shortLabel}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          )}

          {/* The tooltip is HTML rather than SVG, so it inherits type and shadows. */}
          {hovered !== null && data[hovered] && (
            <div className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
              <p className="font-medium">{data[hovered].label}</p>
              <ul className="mt-1 space-y-0.5">
                {data[hovered].values.map((value, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2 rounded-sm"
                      style={{ background: SERIES_PAIR[index] }}
                    />
                    <span className="text-slate-300">{series[index]}</span>
                    <span className={cn('ml-auto tabular-nums')}>
                      {formatMoney(value, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
