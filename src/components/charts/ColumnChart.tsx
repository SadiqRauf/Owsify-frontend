import { useId, useState } from 'react'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { AXIS_INK, BAR_RADIUS, GRID, MAX_BAR_THICKNESS, SERIES, SURFACE_GAP } from './tokens'

export interface ColumnDatum {
  label: string
  /** Shown on the axis; `label` is used in the tooltip and table. */
  shortLabel: string
  value: number
}

interface ColumnChartProps {
  data: ColumnDatum[]
  currency: string
  height?: number
}

/** Axis ticks land on clean numbers, so the reader is not decoding 1,472.83. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0]
  const rough = max / count
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? magnitude * 10
  const ticks: number[] = []
  for (let value = 0; value <= max + step / 2; value += step) ticks.push(value)
  return ticks
}

/**
 * Columns over time. One series, so one hue and no legend.
 *
 * Months with no spending are still plotted as zero — dropping them would
 * silently compress quiet periods and make the trend read wrongly.
 */
export function ColumnChart({ data, currency, height = 220 }: ColumnChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const clipId = useId()

  const PADDING = { top: 16, right: 8, bottom: 28, left: 52 }
  const width = 640
  const plotWidth = width - PADDING.left - PADDING.right
  const plotHeight = height - PADDING.top - PADDING.bottom

  const max = Math.max(...data.map((d) => d.value), 0)
  const ticks = niceTicks(max)
  const scaleMax = Math.max(ticks[ticks.length - 1], 1)

  const band = plotWidth / Math.max(data.length, 1)
  const barWidth = Math.min(MAX_BAR_THICKNESS, Math.max(band - SURFACE_GAP * 2, 4))

  const y = (value: number) => PADDING.top + plotHeight - (value / scaleMax) * plotHeight

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        role="presentation"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          {/* Square at the baseline, rounded only at the data end. */}
          <clipPath id={clipId}>
            <rect x="0" y="0" width={width} height={height} />
          </clipPath>
        </defs>

        {/* Gridlines: hairline, solid, one step off the surface. */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={width - PADDING.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke={GRID}
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fill={AXIS_INK}
              fontSize={11}
            >
              {tick >= 1000 ? `${(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}k` : tick}
            </text>
          </g>
        ))}

        {data.map((datum, index) => {
          const x = PADDING.left + index * band + (band - barWidth) / 2
          const top = y(datum.value)
          const barHeight = Math.max(PADDING.top + plotHeight - top, 0)
          const isHovered = hovered === index

          return (
            <g key={datum.label}>
              {/* Hit area spans the whole band, so the target is much bigger
                  than a thin bar and short bars stay reachable. */}
              <rect
                x={PADDING.left + index * band}
                y={PADDING.top}
                width={band}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHovered(index)}
              />

              {barHeight > 0 && (
                <path
                  d={roundedTopBar(x, top, barWidth, barHeight, BAR_RADIUS)}
                  fill={SERIES}
                  opacity={hovered === null || isHovered ? 1 : 0.45}
                  clipPath={`url(#${clipId})`}
                />
              )}

              <text
                x={PADDING.left + index * band + band / 2}
                y={height - 8}
                textAnchor="middle"
                fill={AXIS_INK}
                fontSize={11}
              >
                {datum.shortLabel}
              </text>
            </g>
          )
        })}

        {/* Baseline sits above the marks so bars read as grown from it. */}
        <line
          x1={PADDING.left}
          x2={width - PADDING.right}
          y1={PADDING.top + plotHeight}
          y2={PADDING.top + plotHeight}
          stroke={GRID}
          strokeWidth={1}
        />
      </svg>

      {hovered !== null && (
        <div
          className={cn(
            'pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg',
            'bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg',
          )}
          style={{
            left: `${((PADDING.left + hovered * band + band / 2) / width) * 100}%`,
            top: `${(y(data[hovered].value) / height) * 100}%`,
          }}
        >
          <p className="font-medium">{data[hovered].label}</p>
          <p className="tabular-nums text-slate-300">
            {formatMoney(data[hovered].value, currency)}
          </p>
        </div>
      )}
    </div>
  )
}

/** A bar with only its top corners rounded, clamped for very short bars. */
function roundedTopBar(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, h, w / 2)
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${y + h}`,
    'Z',
  ].join(' ')
}
