# Splitwise Clone — Frontend

React 19 + TypeScript + Vite, with Tailwind CSS v4, React Router, TanStack Query,
React Hook Form and Zod.

## Setup

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL must point at the backend
npm run dev               # http://localhost:5173
```

The backend must be running on the URL in `VITE_API_URL` (default
`http://localhost:8000/api/v1`), and that origin must appear in the backend's
`CORS_ORIGINS`.

## Scripts

| Command | What |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck then production build into `dist/` |
| `npm run preview` | Serve the built output |
| `npm run lint` | ESLint |

## Layout

```
src/
  config/env.ts          typed, validated access to import.meta.env
  lib/
    api-client.ts        axios instance, ApiError, refresh-on-401 interceptor
    token-storage.ts     the only module that touches localStorage
    query-client.ts      TanStack Query defaults and the cache-key registry
    money.ts             integer-cent arithmetic and currency formatting
    utils.ts             cn(), formatting helpers
  types/api.ts           response shapes mirroring the backend schemas
  features/
    auth/                schemas, api, AuthProvider, useAuth()
    friends/             api, queries, UserSearch
    groups/              api, queries, GroupFormModal, AddMembersModal
    expenses/            api, queries, schemas, ExpenseFormModal, ExpenseList
  components/
    ui/                  Button, Input, Select, Textarea, Modal, Alert, Card,
                         Avatar, Badge, ConfirmDialog
    feedback/            Spinner, Skeleton, ErrorState, EmptyState, ErrorBoundary
    layout/              AppLayout, AuthLayout, Sidebar, Navbar, Logo
  routes/                ProtectedRoute, PublicOnlyRoute
  pages/                 Login, Register, Dashboard, Groups, GroupDetail,
                         Expenses, ExpenseDetail, Friends, Profile, NotFound
```

## Routes

| Path | Access |
| --- | --- |
| `/login`, `/register` | Signed-out only; a signed-in user is sent to `/dashboard` |
| `/dashboard` | Balance tiles, who owes whom, recent activity |
| `/groups`, `/groups/:groupId` | Group list, and detail with members and expenses |
| `/expenses`, `/expenses/:expenseId` | Paged expense list, and detail with edit/delete |
| `/friends` | Friends, requests both ways, and user search |
| `/profile` | Profile and password |
| anything else | 404 page |

Everything except login and register sits behind `ProtectedRoute`.

`ProtectedRoute` stores the attempted location in router state, so after signing in
the user lands where they were originally headed rather than always on the dashboard.

## Auth flow

1. Login or register returns an access token, a refresh token and the user.
2. `token-storage` persists both; `AuthProvider` seeds the `['auth','me']` cache.
3. Every request gets `Authorization: Bearer <access token>` from a request
   interceptor.
4. On a 401, the response interceptor refreshes **once**. Concurrent requests all
   await the same in-flight refresh, so a burst of parallel calls triggers exactly
   one `/auth/refresh`, then each original request is replayed.
5. If refreshing fails, tokens are cleared and the app drops to signed-out.

`token-storage` is the single place that touches `localStorage`, so moving to
httpOnly cookies later means changing one file.

## Errors

Every failed request is normalised into an `ApiError` with `status`, `code`,
`details` and `requestId`. Forms call `error.fieldErrors()` to map the backend's
per-field messages straight into `setError`, so server-side validation shows up
inline on the right input.


## Money

Amounts arrive from the API as decimal strings (`"33.34"`), never numbers, so JSON
never rounds them. `src/lib/money.ts` converts to integer cents for every
calculation — `0.1 + 0.2` is exactly the class of bug that leaves a balance
permanently wrong.

The expense form previews each person's share as you type, using the same
distribution rule the backend applies, so what you see before submitting is what
gets saved. For exact and percentage splits a running total shows how much is still
unassigned, and the form refuses to submit until it balances.
