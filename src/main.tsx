import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from '@/App'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { env } from '@/config/env'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { queryClient } from '@/lib/query-client'

import './index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root is missing from index.html.')
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
        {env.isDev && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
