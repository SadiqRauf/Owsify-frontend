/**
 * Money handling.
 *
 * The API sends amounts as decimal strings ("33.34"), never numbers, so no
 * precision is lost in JSON. All arithmetic here happens in integer cents —
 * `0.1 + 0.2` is exactly the class of bug that makes a balance permanently wrong.
 */

/** "33.34" -> 3334. Returns 0 for anything unparseable. */
export function toCents(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const asNumber = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(asNumber)) return 0
  return Math.round(asNumber * 100)
}

/** 3334 -> "33.34", suitable for sending back to the API. */
export function fromCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const absolute = Math.abs(cents)
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`
}

export function sumCents(values: Array<string | number | null | undefined>): number {
  return values.reduce<number>((total, value) => total + toCents(value), 0)
}

export function formatMoney(value: string | number, currency = 'USD'): string {
  const amount = typeof value === 'number' ? value : Number(value)
  const safe = Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(safe)
}

/** Same as formatMoney but always drops the sign — for "you owe X" style copy. */
export function formatAbsMoney(value: string | number, currency = 'USD'): string {
  const amount = typeof value === 'number' ? value : Number(value)
  return formatMoney(Math.abs(Number.isFinite(amount) ? amount : 0), currency)
}

export function isZero(value: string | number): boolean {
  return toCents(value) === 0
}

export function isPositive(value: string | number): boolean {
  return toCents(value) > 0
}

/**
 * Divide an amount evenly, giving the leftover cents to the earliest shares.
 * Mirrors the backend's equal split so the preview matches what gets saved.
 */
export function splitEvenly(totalCents: number, count: number): number[] {
  if (count <= 0) return []
  const base = Math.floor(totalCents / count)
  const remainder = totalCents - base * count
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0))
}
