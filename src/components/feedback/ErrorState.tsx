import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { getErrorMessage, isApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  error: unknown
  title?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ error, title, onRetry, className }: ErrorStateProps) {
  const offline = isApiError(error) && error.isNetworkError
  const Icon = offline ? WifiOff : AlertTriangle
  const requestId = isApiError(error) ? error.requestId : null

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-card bg-white px-6 py-10 text-center',
        'shadow-sm ring-1 ring-slate-200/70',
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600">
        <Icon aria-hidden className="size-5" />
      </span>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">
          {title ?? (offline ? 'Connection lost' : 'Something went wrong')}
        </h3>
        <p className="max-w-sm text-sm text-slate-500">{getErrorMessage(error)}</p>
      </div>

      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="size-4" />}>
          Try again
        </Button>
      )}

      {requestId && <p className="font-mono text-xs text-slate-400">Request {requestId}</p>}
    </div>
  )
}
