# Owsify — Frontend

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
    currencies.ts        the currency shortlist offered in the UI
    utils.ts             cn(), formatting helpers
  types/api.ts           response shapes mirroring the backend schemas
  features/
    auth/                schemas, api, AuthProvider, useAuth()
    friends/             api, queries, UserSearch
    groups/              api, queries, GroupFormModal, AddMembersModal
    expenses/            api, queries, schemas, ExpenseFormModal, ExpenseList
  components/
    ui/                  Button, Input, Select, CurrencySelect, Textarea, Modal,
                         Alert, Card, Avatar, Badge, ConfirmDialog
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
| `/khata`, `/khata/:khataId` | Khata list, and detail with the entry ledger |
| `/loans`, `/loans/:loanId` | Loans given, and one loan with its repayments |
| `/people`, `/people/:personId` | Everyone you share money with, their timeline and their unified total |
| `/reminders` | What to chase, split into overdue and upcoming |
| `/reports` | Money in and out over a window, with charts |
| `/groups`, `/groups/:groupId` | Group list, and detail with members and expenses |
| `/expenses`, `/expenses/:expenseId` | Paged expense list, and detail with edit/delete |
| `/friends` | Friends, requests both ways, user search, and email invitations |
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


## Currencies

`CurrencySelect` is used on sign-up, the profile, the group form, and personal
expenses. `src/lib/currencies.ts` holds a curated shortlist with names and symbols;
the backend validates against the full ISO 4217 set, and every code here is drawn
from it, so the dropdown can never offer something the API would reject.

Pass `ensureCode` when editing something that already has a currency. An account or
group created against a code outside the shortlist still shows its own value rather
than being silently switched to another currency.

A group expense shows the currency field but disabled: the backend forces the
group's currency so one group never mixes units, and hiding the field would make
that a surprise rather than a rule.

## Invitations

Searching for someone who is not on Owsify shows an invite panel instead of a
dead end. If the search term is already an email address it is prefilled, and the
field then follows the search box until the user edits it — derived state, not an
effect, so there is no cascading render.

If the address turns out to have an account (someone signed up between the search
and the invite), the panel quietly sends a friend request instead of surfacing the
conflict as an error.


## The name

The product is **Owsify**. The Postgres role and database are still called
`splitwise`, as is the repository directory — those are infrastructure identifiers
on a running server, and changing them means recreating and migrating rather than
renaming. Say the word and I will do it as a separate, deliberate step.

Renaming the `localStorage` keys from `splitwise.*` to `owsify.*` signs out anyone
holding an old token once, because the app no longer looks under the old keys.


## Brand assets

`public/logo.png` is the supplied lockup: mark, wordmark and tagline on a
transparent background, 1408×768 with wide margins. Three assets are derived from
it, cropped to the measured alpha bounds rather than by eye:

| File | From | Used for |
| --- | --- | --- |
| `logo-mark.png` | the mark, padded square, 192px | sidebar and navbar at 32px |
| `logo-lockup.png` | mark + wordmark, trimmed, 640px wide | the sign-in and sign-up pages |
| `favicon-32.png`, `apple-touch-icon.png` | the mark | browser tab and home screen |

The sidebar pairs the mark with the wordmark as **text** rather than using the
lockup: at the 32px the header allows, the lockup's tagline is unreadable, and
scaling artwork down until its words vanish is worse than not showing them.

## Khata ledger

The ledger table carries a **balance-after** column per row, which the server
computes over the khata's whole history. It therefore stays meaningful on page two
and under a date filter, and the totals above the table describe the khata rather
than the filtered page — a filtered view must never make an unsettled khata look
settled.

`relative` on the table's scroll container is load-bearing. The `sr-only` caption
and column labels are absolutely positioned, and an absolutely positioned element is
only clipped by an ancestor that is its containing block. Without it they escape the
scroll box at the table's full width, and the whole page scrolls sideways on a
phone.

**Attachments on an entry are not built** — the app has no file storage — and the
form says so rather than offering an input that drops what it takes.

## Dates

`formatDate` treats a bare `YYYY-MM-DD` as a calendar date, building it from its
parts rather than through `new Date(string)`. The latter parses it as UTC midnight,
which renders as the *previous day* anywhere west of Greenwich: an expense dated
today would show as yesterday. Timestamps still parse normally — those really are
instants. `todayIso()` is the matching local-calendar default for date inputs.

## People

`/people/:personId` adds one person up across group expenses, khata and loans. Every
component is signed the same way (positive = they owe you), so the total is a plain
sum, and all of it is scoped to one currency.

The Loans row links to that person's loans when they have any. It was a stated zero
until the loan feature existed.

Khata contacts with no account appear on `/people` marked *Khata only* and link to
their khata: `/people/:id` is keyed by user id, so they cannot have a person page.

## Loans

A loan runs in one of two directions, chosen on the form before anything else — it
changes the meaning of every other field, so it is a pair of buttons rather than a
select buried among them.

`paid`, `remaining`, `overpaid`, `signed_balance` and `status` all come from the
server, derived from the payments — the client never computes them, so the list, the
detail page and the reports cannot disagree.

**Overpaying flips the balance.** Repay 1,500 against a 1,000 loan and the detail
page stops leading with the progress bar, which has no way to show a debt running
backwards, and states the outcome instead: *You owe Ahmed PKR 500.00*, with the
arithmetic spelled out under it. The status badge says **Overpaid**, never Paid —
those mean opposite things about who owes whom.

The list totals show both sides — *owed to you* and *owed by you* — rather than only
the net, because being owed 50,000 while owing 30,000 is not the same situation as
being owed 20,000. The status badge always carries an icon and a word, never colour alone:
colour is unavailable to a screen reader and unreliable for a colourblind reader, and
"overdue" is exactly the state that must not be missed.

The progress bar is decoration. The Paid and Remaining figures beside it carry the same
information, so the proportion is never the only way to read a loan.

"Mark as paid" opens a confirmation that says it will record a payment dated today,
because that is what it does — and it suggests adding the payment by hand instead if
the money arrived on a different date.

## Notes, reminders and the timeline

Notes are added and edited **inline**, not in a modal: a note is a sentence, and
pushing a dialog in front of one sentence costs more attention than it saves.

The timeline groups by day so a date is printed once instead of on every row, and each
of the six kinds gets its own icon — without a per-kind mark a reader has to parse every
title to tell a loan from a note.

A reminder held back by a future `remind_on` is labelled *Silent until …* rather than
hidden, so it cannot look forgotten. The completion control is a checkbox rather than a
menu item, because marking a reminder done is the action people take most.

## Charts

Single-series charts use one hue and no legend — the title names what is plotted, and
colouring bars darker-where-bigger would double-encode length as hue.

The two-series charts on Reports use a **validated** palette, not a chosen one:
`SERIES_PAIR` separates by ΔE 22.9 under deuteranopia and 31.6 for normal vision, both
past the floors, with each step clearing 3:1 against the surface. Hues are assigned in
fixed order, so the hue follows the series and never its rank. Two series mean colour
is carrying identity, so a legend is always present and a **table view** sits behind
one button for anyone who cannot use the chart at all.

Charts are drawn at the container's real pixel size rather than in a scaled viewBox: a
scaled viewBox stretches an 11px axis label to 24px on a wide screen and 7px on a
phone, and stops a 1px hairline being 1px.

## Two layout traps

Two bugs here came from the same family, and both are commented at the site.

**`relative` on a table's scroll container.** The `sr-only` caption and column labels
are absolutely positioned, and an absolutely positioned element is only clipped by an
ancestor that is its containing block. Without `relative` they escape the scroll box at
the table's full width and the whole page scrolls sideways on a phone.

**`min-w-0` on grid items.** A grid item defaults to `min-width: auto` and so refuses
to shrink below its content's min-content width. A long name beside a
`whitespace-nowrap` amount then drags the card — and the page — past the viewport, and
the `truncate` inside never gets to act.

Both were found by measuring `documentElement.scrollWidth` on every route at 390px,
not by looking at screenshots.
