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
export function resolveSuccessToast(method: string, url: string): ResolvedToast | null {
  const verb = method.toLowerCase() as Method
  if (!['post', 'patch', 'put', 'delete'].includes(verb)) return null

  // Compare against the path only: a query string must not affect the match.
  const path = url.split('?')[0].replace(/\/+$/, '')

  for (const rule of RULES) {
    const methods = Array.isArray(rule.method) ? rule.method : [rule.method]
    if (!methods.includes(verb)) continue
    if (!rule.pattern.test(path)) continue
    return rule.message === null
      ? null
      : { title: rule.message, description: rule.description }
  }

  // An unmatched write still gets acknowledged. A new endpoint should default to
  // saying something rather than to silence.
  return { title: 'Saved' }
}
