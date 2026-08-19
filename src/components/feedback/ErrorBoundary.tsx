import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last line of defence for render-time crashes. Query and mutation failures are
 * handled by <ErrorState>; this only catches what React itself throws.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-card bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70">
          <h1 className="text-lg font-semibold text-slate-900">This page hit an error</h1>
          <p className="mt-2 text-sm text-slate-500">{error.message}</p>
          <Button className="mt-5" onClick={() => window.location.reload()}>
            Reload the app
          </Button>
        </div>
      </div>
    )
  }
}
