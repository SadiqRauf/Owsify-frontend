import { useId, useMemo, useState } from 'react'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { AXIS_INK, BAR_RADIUS, GRID, MAX_BAR_THICKNESS, SERIES, SURFACE_GAP } from './tokens'
import { useElementWidth } from './useElementWidth'

export interface ColumnDatum {
  /** Full name, used in the tooltip and the accessible summary. */
  label: string
  /** Terse form for the axis, e.g. a day number or a month abbreviation. */
  shortLabel: string
  value: number
  /** Marks the most recent bucket, so "now" is findable at a glance. */
  isCurrent?: boolean
}

interface ColumnChartProps {
  data: ColumnDatum[]
  currency: string
}

/** Axis ticks land on clean numbers, so the reader is not decoding 1,472.83. */
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
 * Columns over time. One series, so one hue and no legend.
 *
 * Drawn at the container's real pixel size rather than in a scaled viewBox. A
 * scaled viewBox stretches everything with the container: an 11px axis label
 * becomes 24px on a wide screen and 7px on a phone, and a 1px hairline stops being
 * 1px. Measuring instead keeps type and strokes the size they were chosen to be,
 * and lets the axis thin its labels out when there is no room.
 *
 * Empty buckets are still plotted — as a flat baseline tick rather than nothing —
 * because a gap in the chart reads as missing data, not as a quiet day.
 */
export function ColumnChart({ data, currency }: ColumnChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>()
  const [hovered, setHovered] = useState<number | null>(null)
  const clipId = useId()

  const isNarrow = width > 0 && width < 480
  const height = isNarrow ? 180 : 240
  const padding = {
    top: 14,
    right: 4,
    bottom: 26,
    // Room for the widest tick label, which is shorter on a phone.
    left: isNarrow ? 38 : 48,
  }

  const plotWidth = Math.max(width - padding.left - padding.right, 0)
  const plotHeight = height - padding.top - padding.bottom

  const max = Math.max(...data.map((d) => d.value), 0)
  const ticks = niceTicks(max)
  const scaleMax = Math.max(ticks[ticks.length - 1], 1)

  const band = plotWidth / Math.max(data.length, 1)
  const barWidth = Math.max(Math.min(MAX_BAR_THICKNESS, band - SURFACE_GAP * 2), 2)

  // Label as many buckets as will fit without the text colliding. Each label needs
  // roughly its own width plus breathing room, and that is what sets the stride —
  // not a fixed count that is too sparse on a monitor and too dense on a phone.
  const labelStride = useMemo(() => {
    const perLabel = isNarrow ? 30 : 40
    const affordable = Math.max(Math.floor(plotWidth / perLabel), 1)
    return Math.max(Math.ceil(data.length / affordable), 1)
  }, [data.length, plotWidth, isNarrow])

  // Counted back from the most recent bucket, so the newest is always labelled.
  const shouldLabel = (index: number) => (data.length - 1 - index) % labelStride === 0

  const y = (value: number) => padding.top + plotHeight - (value / scaleMax) * plotHeight
  const centreOf = (index: number) => padding.left + index * band + band / 2

  const active = hovered !== null ? data[hovered] : null

  return (
    <div ref={ref} className="relative w-full">
      {/* Width is 0 on the first paint, before the resize observer reports. */}
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="presentation"
          /* A stable hook: every card also contains lucide icons, which are svgs
             too, so "the svg in this section" is not specific enough to target. */
          data-chart="column"
          className="block select-none"
          onMouseLeave={() => setHovered(null)}
          onTouchEnd={() => setHovered(null)}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={width} height={height} />
            </clipPath>
          </defs>

          {/* Gridlines: hairline, solid, one step off the surface. */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke={GRID}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={padding.left - 8}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fill={AXIS_INK}
                fontSize={11}
              >
                {compact(tick)}
              </text>
            </g>
          ))}

          {/* A wash behind the hovered column, so the eye can follow it down. */}
          {hovered !== null && (
            <rect
              x={padding.left + hovered * band}
              y={padding.top}
              width={band}
              height={plotHeight}
              fill={SERIES}
              opacity={0.07}
            />
          )}

          {data.map((datum, index) => {
            const x = centreOf(index) - barWidth / 2
            const top = y(datum.value)
            const barHeight = Math.max(padding.top + plotHeight - top, 0)
            const isHovered = hovered === index

            return (
              <g key={`${datum.label}-${index}`}>
                {/* Hit area spans the whole band, so the target is far bigger than
                    a thin bar and short bars stay reachable on a touchscreen. */}
                <rect
                  x={padding.left + index * band}
                  y={padding.top}
                  width={band}
                  height={plotHeight}
                  fill="transparent"
                  onMouseEnter={() => setHovered(index)}
                  onTouchStart={() => setHovered(index)}
                />

                {datum.value > 0 ? (
                  <path
                    d={roundedTopBar(x, top, barWidth, barHeight, BAR_RADIUS)}
                    fill={SERIES}
                    opacity={hovered === null || isHovered ? 1 : 0.35}
                    clipPath={`url(#${clipId})`}
                    className="transition-opacity duration-150"
                  />
                ) : (
                  <rect
                    x={x}
                    y={padding.top + plotHeight - 1}
                    width={barWidth}
                    height={1}
                    fill={GRID}
                  />
                )}

                {shouldLabel(index) && (
                  <text
                    x={centreOf(index)}
                    y={height - 8}
                    textAnchor="middle"
                    fill={AXIS_INK}
                    fontSize={11}
                    fontWeight={datum.isCurrent ? 600 : 400}
                  >
                    {datum.shortLabel}
                  </text>
                )}
              </g>
            )
          })}

          {/* Baseline last, so bars read as grown from it. */}
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + plotHeight}
            y2={padding.top + plotHeight}
            stroke={GRID}
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
        </svg>
      )}

      {active && hovered !== null && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full',
            'whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg',
          )}
          style={{
            // Clamped so the tooltip cannot hang off either edge of the card.
            left: Math.min(Math.max(centreOf(hovered), 60), Math.max(width - 60, 60)),
            top: Math.max(y(active.value) - 6, 4),
          }}
        >
          <p className="font-medium">{active.label}</p>
          <p className="tabular-nums text-slate-300">
            {active.value > 0 ? formatMoney(active.value, currency) : 'Nothing spent'}
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
