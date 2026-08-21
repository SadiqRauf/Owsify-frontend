/**
 * What to say when a write succeeds.
 *
 * Every POST / PATCH / DELETE gets a confirmation toast, decided here rather than
 * at each call site. There are 24 write endpoints across six feature modules; a
 * rule per call site is a rule someone forgets on the twenty-fifth, and a silent
 * success is indistinguishable from a request that never fired.
 *
 * A few writes are deliberately silent — listed below with the reason. Silence is
 * a decision recorded in one place, not an omission scattered across components.
 */

type Method = 'post' | 'patch' | 'put' | 'delete'

interface Rule {
  method: Method | Method[]
  /** Matched against the request path, e.g. `/groups/abc-123/members`. */
  pattern: RegExp
  /** `null` means deliberately silent. */
  message: string | null
  description?: string
  reason?: string
  /**
   * For routes whose outcome depends on what was sent, not just where. Given the
   * request's query and body, returns the message to use instead of `message`.
   *
   * Needed where one route does two materially different things: archiving a
   * ledger and deleting it must not read the same, and a PATCH that archives
   * should confirm "archived" rather than the literal truth of "updated".
   */
  resolve?: (request: RequestContext) => ResolvedToast
}

export interface RequestContext {
  params: Record<string, unknown>
  body: Record<string, unknown>
}

const UUID = '[0-9a-f-]{36}'

const RULES: Rule[] = [
  // --- Deliberately silent ------------------------------------------------- //
  {
    method: 'post',
    pattern: /\/auth\/(login|register|token)$/,
    message: null,
    reason: 'Landing on the dashboard is the confirmation; a toast on top is noise.',
  },
  {
    method: 'post',
    pattern: /\/auth\/logout$/,
    message: null,
    reason: 'Arriving back at the sign-in page says it more clearly than a toast.',
  },
  {
    method: 'post',
    pattern: /\/auth\/refresh$/,
    message: null,
    reason: 'Background token rotation. The user did not ask for it and must not see it.',
  },
  {
    method: 'post',
    pattern: /\/friends\/invitations$/,
    message: null,
    reason:
      'The invite panel already explains what happened, including whether mail was ' +
      'actually sent — a generic "Invitation sent" toast could contradict it.',
  },

  // --- Account ------------------------------------------------------------- //
  { method: 'patch', pattern: /\/users\/me$/, message: 'Profile updated' },
  {
    method: 'post',
    pattern: /\/users\/me\/password$/,
    message: 'Password updated',
    description: 'You have been signed out of every other device.',
  },

  // --- Friends ------------------------------------------------------------- //
  {
    method: 'post',
    pattern: new RegExp(`/friends/requests/${UUID}/accept$`),
    message: 'Friend request accepted',
  },
  {
    method: 'post',
    pattern: new RegExp(`/friends/requests/${UUID}/reject$`),
    message: 'Friend request declined',
  },
  {
    method: 'delete',
    pattern: new RegExp(`/friends/requests/${UUID}$`),
    message: 'Request withdrawn',
  },
  {
    method: 'post',
    pattern: /\/friends\/requests$/,
    message: 'Friend request sent',
  },
  {
    method: 'post',
    pattern: new RegExp(`/friends/invitations/${UUID}/resend$`),
    message: 'Invitation sent again',
  },
  {
    method: 'delete',
    pattern: new RegExp(`/friends/invitations/${UUID}$`),
    message: 'Invitation cancelled',
  },
  { method: 'delete', pattern: new RegExp(`/friends/${UUID}$`), message: 'Friend removed' },

  // --- Groups -------------------------------------------------------------- //
  { method: 'post', pattern: /\/groups$/, message: 'Group created' },
  {
    method: 'post',
    pattern: new RegExp(`/groups/${UUID}/members$`),
    message: 'Members added',
  },
  {
    method: 'post',
    pattern: new RegExp(`/groups/${UUID}/transfer-ownership/${UUID}$`),
    message: 'Ownership transferred',
  },
  {
    method: 'patch',
    pattern: new RegExp(`/groups/${UUID}/members/${UUID}$`),
    message: 'Role updated',
  },
  {
    method: 'delete',
    pattern: new RegExp(`/groups/${UUID}/members/${UUID}$`),
    message: 'Member removed',
  },
  { method: 'patch', pattern: new RegExp(`/groups/${UUID}$`), message: 'Group updated' },
  {
    method: 'delete',
    pattern: new RegExp(`/groups/${UUID}$`),
    message: 'Group deleted',
    description: 'Its expenses were removed with it.',
  },

  // --- Expenses ------------------------------------------------------------ //
  { method: 'post', pattern: /\/expenses$/, message: 'Expense added' },
  { method: 'patch', pattern: new RegExp(`/expenses/${UUID}$`), message: 'Expense updated' },
  {
    method: 'delete',
    pattern: new RegExp(`/expenses/${UUID}$`),
    message: 'Expense deleted',
    description: 'Balances have been updated.',
  },

  // --- Khata --------------------------------------------------------------- //
  { method: 'post', pattern: /\/khata$/, message: 'Khata added' },
  // Entry rules come before the khata rules below only in intent — matching is by
  // pattern, and `/khata/{id}/entries` cannot collide with `/khata/{id}`.
  {
    method: 'post',
    pattern: new RegExp(`/khata/${UUID}/entries$`),
    message: 'Entry added',
    resolve: ({ body }) => {
      if (body.entry_type === 'received') {
        return { title: 'Payment recorded', description: 'They owe you less now.' }
      }
      if (body.entry_type === 'adjustment') return { title: 'Adjustment recorded' }
      return { title: 'Entry added', description: 'They owe you more now.' }
    },
  },
  {
    method: 'patch',
    pattern: new RegExp(`/khata/entries/${UUID}$`),
    message: 'Entry updated',
    description: 'The balance has been recalculated.',
  },
  {
    method: 'delete',
    pattern: new RegExp(`/khata/entries/${UUID}$`),
    message: 'Entry deleted',
    description: 'The balance has been recalculated.',
  },
  {
    method: 'patch',
    pattern: new RegExp(`/khata/${UUID}$`),
    message: 'Khata updated',
    resolve: ({ body }) => {
      // Archiving and restoring both arrive as a PATCH, but the reader pressed a
      // button that said Archive — confirm the thing they asked for.
      if (body.is_archived === true) {
        return { title: 'Khata archived', description: 'Its entries are kept.' }
      }
      if (body.is_archived === false) return { title: 'Khata restored' }
      return { title: 'Khata updated' }
    },
  },
  {
    method: 'delete',
    pattern: new RegExp(`/khata/${UUID}$`),
    message: 'Khata archived',
    resolve: ({ params }) =>
      params.permanent
        ? { title: 'Khata deleted', description: 'Its entries were removed with it.' }
        : { title: 'Khata archived', description: 'Its entries are kept.' },
  },

  // --- Loans --------------------------------------------------------------- //
  {
    method: 'post',
    pattern: /\/loans$/,
    message: 'Loan recorded',
    resolve: ({ body }) =>
      body.direction === 'taken'
        ? { title: 'Loan recorded', description: 'You owe them this.' }
        : { title: 'Loan recorded', description: 'They owe you this.' },
  },
  {
    method: 'post',
    pattern: new RegExp(`/loans/${UUID}/payments$`),
    message: 'Payment recorded',
    description: 'The remaining amount has been recalculated.',
  },
  {
    method: 'post',
    pattern: new RegExp(`/loans/${UUID}/settle$`),
    message: 'Loan marked as paid',
    description: 'The closing payment was added to its history.',
  },
  {
    method: 'patch',
    pattern: new RegExp(`/loans/${UUID}$`),
    message: 'Loan updated',
    resolve: ({ body }) => {
      // Write-off and reopen both arrive as a PATCH, but the reader pressed a
      // button that said one or the other — confirm what they asked for.
      if (body.status === 'cancelled') {
        return { title: 'Loan written off', description: 'Its payments are kept.' }
      }
      if (body.status) return { title: 'Loan reopened' }
      return { title: 'Loan updated' }
    },
  },
  {
    method: 'delete',
    pattern: new RegExp(`/loans/${UUID}$`),
    message: 'Loan written off',
    resolve: ({ params }) =>
      params.permanent
        ? { title: 'Loan deleted', description: 'Its payments were removed with it.' }
        : { title: 'Loan written off', description: 'Its payments are kept.' },
  },
  {
    method: 'patch',
    pattern: new RegExp(`/loans/payments/${UUID}$`),
    message: 'Payment updated',
    description: 'The remaining amount has been recalculated.',
  },
  {
    method: 'delete',
    pattern: new RegExp(`/loans/payments/${UUID}$`),
    message: 'Payment deleted',
    description: 'That amount is back on the loan.',
  },

  // --- Notes and reminders --------------------------------------------------- //
  { method: 'post', pattern: /\/notes$/, message: 'Note added' },
  { method: 'patch', pattern: new RegExp(`/notes/${UUID}$`), message: 'Note updated' },
  { method: 'delete', pattern: new RegExp(`/notes/${UUID}$`), message: 'Note deleted' },
  { method: 'post', pattern: /\/reminders$/, message: 'Reminder set' },
  {
    method: 'patch',
    pattern: new RegExp(`/reminders/${UUID}$`),
    message: 'Reminder updated',
    resolve: ({ body }) => {
      // Completing and reopening both arrive as a PATCH; confirm the thing the
      // reader actually pressed.
      if (body.completed === true) return { title: 'Reminder completed' }
      if (body.completed === false) return { title: 'Reminder reopened' }
      return { title: 'Reminder updated' }
    },
  },
  { method: 'delete', pattern: new RegExp(`/reminders/${UUID}$`), message: 'Reminder deleted' },

  // --- Settlements --------------------------------------------------------- //
  {
    method: 'post',
    pattern: /\/settlements$/,
    message: 'Payment recorded',
    description: 'Balances have been updated.',
  },
  { method: 'patch', pattern: new RegExp(`/settlements/${UUID}$`), message: 'Payment updated' },
  {
    method: 'delete',
    pattern: new RegExp(`/settlements/${UUID}$`),
    message: 'Payment deleted',
    description: 'The debt it settled is back.',
  },
]

export interface ResolvedToast {
  title: string
  description?: string
}

/**
 * The message for a successful write, or `null` when it should stay quiet.
 *
 * Rules are matched in order, so more specific paths must be listed before the
 * shorter ones they would otherwise be shadowed by (`/groups/{id}/members/{id}`
 * before `/groups/{id}`).
 */
export function resolveSuccessToast(
  method: string,
  url: string,
  request: Partial<RequestContext> = {},
): ResolvedToast | null {
  const verb = method.toLowerCase() as Method
  if (!['post', 'patch', 'put', 'delete'].includes(verb)) return null

  // Matched on the path alone, so a query string cannot affect *which* rule wins;
  // a rule that cares about what was sent reads it through resolve() instead.
  const path = url.split('?')[0].replace(/\/+$/, '')

  for (const rule of RULES) {
    const methods = Array.isArray(rule.method) ? rule.method : [rule.method]
    if (!methods.includes(verb)) continue
    if (!rule.pattern.test(path)) continue
    if (rule.message === null) return null
    if (rule.resolve) {
      return rule.resolve({ params: request.params ?? {}, body: request.body ?? {} })
    }
    return { title: rule.message, description: rule.description }
  }

  // An unmatched write still gets acknowledged. A new endpoint should default to
  // saying something rather than to silence.
  return { title: 'Saved' }
}
