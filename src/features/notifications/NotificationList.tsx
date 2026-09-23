import { useNavigate } from 'react-router-dom'

import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/types/api'

import { useMarkNotificationRead } from './queries'

const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

const STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
  ['year', Infinity],
]

/** "3 minutes ago", "yesterday". A notification is about how recent, not which date. */
function timeAgo(iso: string): string {
  let value = (new Date(iso).getTime() - Date.now()) / 1000
  for (const [unit, size] of STEPS) {
    if (Math.abs(value) < size) return RELATIVE.format(Math.round(value), unit)
    value /= size
  }
  return RELATIVE.format(Math.round(value), 'year')
}

interface NotificationListProps {
  items: AppNotification[]
  /** Called after a row is chosen, so a dropdown can close itself. */
  onNavigate?: () => void
  className?: string
}

export function NotificationList({ items, onNavigate, className }: NotificationListProps) {
  const navigate = useNavigate()
  const markRead = useMarkNotificationRead()

  const open = (notification: AppNotification) => {
    if (!notification.is_read) markRead.mutate(notification.id)
    onNavigate?.()
    if (notification.href) navigate(notification.href)
  }

  return (
    <ul className={cn('divide-y divide-slate-100', className)}>
      {items.map((notification) => (
        <li key={notification.id}>
          <button
            type="button"
            onClick={() => open(notification)}
            className={cn(
              'flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50',
              !notification.is_read && 'bg-brand-50/60',
            )}
          >
            <Avatar
              name={notification.actor?.full_name ?? '?'}
              src={notification.actor?.avatar_url}
              size="sm"
            />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-sm',
                  notification.is_read ? 'text-slate-600' : 'font-medium text-slate-900',
                )}
              >
                {notification.message}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {timeAgo(notification.created_at)}
              </span>
            </span>
            {!notification.is_read && (
              <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600" />
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
