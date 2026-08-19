import { Navigate, Outlet } from 'react-router-dom'

import { FullPageLoader } from '@/components/feedback/Spinner'
import { useAuth } from '@/features/auth/use-auth'

/** Keeps an already signed-in user out of the login and register pages. */
export function PublicOnlyRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <FullPageLoader label="Checking your session" />
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
