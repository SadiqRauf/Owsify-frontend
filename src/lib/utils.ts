import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes so later conditional classes win over earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "Ada Lovelace" -> "AL". Used for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amount)
}

/** Matches a date-only value, with no time and no zone: "2026-08-20". */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export function formatDate(value: string | Date): string {
  // A bare YYYY-MM-DD is a calendar date, not an instant. `new Date()` parses it
  // as UTC midnight, which renders as the *previous* day anywhere west of
  // Greenwich — an expense dated today would show as yesterday. Building it from
  // the parts pins it to local midnight instead, so the date shown is the date
  // that was entered. Timestamps still parse normally: they really are instants.
  const date =
    typeof value === 'string'
      ? DATE_ONLY.test(value)
        ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
        : new Date(value)
      : value

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)
}

/** Today as a calendar date, for date inputs and defaults. */
export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
