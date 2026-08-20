import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { FullPageLoader } from '@/components/feedback/Spinner'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'

/**
 * Signed-in pages are split out of the entry bundle.
 *
 * Login and register are eager: they are the first thing a signed-out visitor
 * sees, and putting a loading spinner in front of a login form to save bytes is
 * a bad trade. Everything behind auth is fetched while the session resolves.
 */
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const GroupsPage = lazy(() =>
  import('@/pages/GroupsPage').then((m) => ({ default: m.GroupsPage })),
)
const GroupDetailPage = lazy(() =>
  import('@/pages/GroupDetailPage').then((m) => ({ default: m.GroupDetailPage })),
)
const ExpensesPage = lazy(() =>
  import('@/pages/ExpensesPage').then((m) => ({ default: m.ExpensesPage })),
)
const ExpenseDetailPage = lazy(() =>
  import('@/pages/ExpenseDetailPage').then((m) => ({ default: m.ExpenseDetailPage })),
)
const SettlementsPage = lazy(() =>
  import('@/pages/SettlementsPage').then((m) => ({ default: m.SettlementsPage })),
)
const ActivityPage = lazy(() =>
  import('@/pages/ActivityPage').then((m) => ({ default: m.ActivityPage })),
)
const FriendsPage = lazy(() =>
  import('@/pages/FriendsPage').then((m) => ({ default: m.FriendsPage })),
)
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader label="Loading" />}>
      <Routes>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Signed-out only */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Signed-in only */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:groupId" element={<GroupDetailPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/expenses/:expenseId" element={<ExpenseDetailPage />} />
            <Route path="/settlements" element={<SettlementsPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
