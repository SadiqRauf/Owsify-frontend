import type { Reminder } from '@/types/api'

/**
 * How a reminder's timing should read, matching the brief's "Due in 5 days".
 *
 * Its own module rather than a second export from the list: a file that mixes
 * components and plain functions breaks Fast Refresh for everything in it.
 */
export function reminderTiming(reminder: Reminder): string {
  if (reminder.status === 'completed') return 'Done'
  const days = reminder.days_until_due
  if (days < -1) return `${Math.abs(days)} days overdue`
  if (days === -1) return 'Overdue by a day'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}
