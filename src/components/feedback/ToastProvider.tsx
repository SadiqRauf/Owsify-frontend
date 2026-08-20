import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { subscribeToToasts } from '@/lib/toast-bus'
import { cn } from '@/lib/utils'

import { ToastContext, type Toast, type ToastContextValue, type ToastTone } from './toast-context'

const AUTO_DISMISS_MS = 5000

const TONES: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-emerald-600' },
  error: { icon: AlertCircle, className: 'text-red-600' },
  info: { icon: Info, className: 'text-blue-600' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<string, number>())
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (input: Omit<Toast, 'id'>) => {
      counter.current += 1
      const id = `toast-${counter.current}`
      setToasts((current) => [...current, { ...input, id }])

      // Errors stay until dismissed: they usually carry something the reader
      // needs to act on, and a message that vanishes mid-read is worse than none.
      if (input.tone !== 'error') {
        timers.current.set(id, window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS))
      }
    },
    [dismiss],
  )

  // Writes are confirmed by the api-client interceptor, which cannot use a hook.
  useEffect(() => subscribeToToasts((input) => toast(input)), [toast])

  const value: ToastContextValue = useMemo(
    () => ({
      toast,
      success: (title, description) => toast({ tone: 'success', title, description }),
      error: (title, description) => toast({ tone: 'error', title, description }),
      dismiss,
    }),
    [toast, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* aria-live so a toast is announced without stealing focus mid-task. */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        {toasts.map((item) => {
          const { icon: Icon, className } = TONES[item.tone]
          return (
            <div
              key={item.id}
              role={item.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-white p-3.5 shadow-lg ring-1 ring-slate-200"
            >
              <Icon aria-hidden className={cn('mt-0.5 size-5 shrink-0', className)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="-m-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
