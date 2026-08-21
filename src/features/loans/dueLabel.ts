/**
 * How a due date should read, given how far away it is.
 *
 * Its own module rather than a second export from the badge: a file that mixes
 * components and plain functions breaks Fast Refresh for everything in it.
 */
export function dueLabel(daysUntilDue: number | null): string | null {
  if (daysUntilDue === null) return null
  if (daysUntilDue < -1) return `${Math.abs(daysUntilDue)} days overdue`
  if (daysUntilDue === -1) return 'Overdue by a day'
  if (daysUntilDue === 0) return 'Due today'
  if (daysUntilDue === 1) return 'Due tomorrow'
  return `Due in ${daysUntilDue} days`
}
