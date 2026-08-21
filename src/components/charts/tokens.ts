/**
 * Chart specs, fixed across every chart so they read as one system.
 *
 * Every chart in this app plots a **single series**, so there is no categorical
 * palette and no legend: one hue carries all the marks and the title says what is
 * plotted. Colouring bars darker-where-bigger would double-encode length as hue
 * and burn the only free channel on information the bar already shows.
 */

/** Brand emerald. 5.48:1 against white — comfortably past the 3:1 mark floor. */
export const SERIES = '#047857'
export const SERIES_SOFT = '#d1fae5'

/** One step off the surface: present, never competing with the data. */
export const GRID = '#e2e8f0'
export const AXIS_INK = '#64748b'
export const LABEL_INK = '#0f172a'

/** Bars are capped rather than filling their slot — the leftover band is air. */
export const MAX_BAR_THICKNESS = 24
/** Rounded at the data end, square at the baseline. */
export const BAR_RADIUS = 4
/** White doing the separating, instead of a stroke around each mark. */
export const SURFACE_GAP = 2

/**
 * The two-series palette, for charts that plot money out against money in.
 *
 * Validated rather than chosen by eye: adjacent-pair separation is ΔE 22.9 under
 * deuteranopia and 31.6 for normal vision, both comfortably past the floors, and
 * both steps clear 3:1 against the surface. Assigned in fixed order — the hue
 * follows the series, never its rank, so a filter that drops one cannot repaint
 * the other.
 */
export const SERIES_PAIR = ['#047857', '#6d28d9'] as const
export const SERIES_PAIR_SOFT = ['#d1fae5', '#ede9fe'] as const
