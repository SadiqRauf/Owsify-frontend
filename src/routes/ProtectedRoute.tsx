import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { FullPageLoader } from '@/components/feedback/Spinner'
import { useAuth } from '@/features/auth/use-auth'

/** Gate for signed-in pages. Remembers where the user was headed. */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <FullPageLoader label="Checking your session" />
  }

  if (status === 'unauthenticated') {
    // `state.from` lets the login page send the user back where they came from.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
