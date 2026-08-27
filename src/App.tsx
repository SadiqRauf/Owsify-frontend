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
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('@/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const KhataListPage = lazy(() =>
  import('@/pages/KhataListPage').then((m) => ({ default: m.KhataListPage })),
)
const KhataDetailPage = lazy(() =>
  import('@/pages/KhataDetailPage').then((m) => ({ default: m.KhataDetailPage })),
)
const LoansListPage = lazy(() =>
  import('@/pages/LoansListPage').then((m) => ({ default: m.LoansListPage })),
)
const LoanDetailPage = lazy(() =>
  import('@/pages/LoanDetailPage').then((m) => ({ default: m.LoanDetailPage })),
)
const ReportsPage = lazy(() =>
  import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
const RemindersPage = lazy(() =>
  import('@/pages/RemindersPage').then((m) => ({ default: m.RemindersPage })),
)
const PeopleListPage = lazy(() =>
  import('@/pages/PeopleListPage').then((m) => ({ default: m.PeopleListPage })),
)
const PersonDetailPage = lazy(() =>
  import('@/pages/PersonDetailPage').then((m) => ({ default: m.PersonDetailPage })),
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/*
          Reachable signed in or out, unlike the other auth pages. Someone who still
          has a live session on this device may be resetting precisely because they
          think someone else has one too — bouncing them to the dashboard would put
          the guard in the way of the recovery it exists to protect.
        */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Signed-in only */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/khata" element={<KhataListPage />} />
            <Route path="/khata/:khataId" element={<KhataDetailPage />} />
            <Route path="/loans" element={<LoansListPage />} />
            <Route path="/loans/:loanId" element={<LoanDetailPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/people" element={<PeopleListPage />} />
            <Route path="/people/:personId" element={<PersonDetailPage />} />
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
