import { useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Spinner } from '@/components/feedback/Spinner'
import { invalidateLedger, queryKeys } from '@/lib/query-client'

import { NotificationList } from './NotificationList'
import { useMarkAllNotificationsRead, useNotifications, useUnreadCount } from './queries'

const PREVIEW_SIZE = 8

export function NotificationBell() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: unread = 0 } = useUnreadCount()
  const { data, isLoading } = useNotifications({ limit: PREVIEW_SIZE }, { enabled: open })
  const markAll = useMarkAllNotificationsRead()

  // A rising count means someone else changed something this user can see. The
  // page they are on may be showing it, so refresh what notifications are about
  // rather than leaving a balance stale until the next navigation.
  const previousUnread = useRef(unread)
  useEffect(() => {
    if (unread > previousUnread.current) {
      invalidateLedger()
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    }
    previousUnread.current = unread
  }, [unread, queryClient])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const badge = unread > 99 ? '99+' : String(unread)

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
      >
        <Bell aria-hidden className="size-5" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-4 top-16 mt-2 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={unread === 0 || markAll.isPending}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              <CheckCheck aria-hidden className="size-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : data && data.items.length > 0 ? (
              <NotificationList items={data.items} onNavigate={() => setOpen(false)} />
            ) : (
              <p className="px-3 py-8 text-center text-sm text-slate-500">
                You are all caught up.
              </p>
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-3 py-2 text-center text-sm font-medium text-brand-700 hover:bg-slate-50"
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
