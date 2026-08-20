/** Shapes returned by the FastAPI backend. Mirrors app/schemas on the server. */

export interface User {
  id: string
  email: string
  full_name: string
  currency: string
  avatar_url: string | null
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface AuthResponse extends TokenPair {
  user: User
}

export interface ApiErrorDetail {
  field?: string | null
  message: string
  type?: string | null
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details: ApiErrorDetail[]
  }
  request_id: string | null
}

export interface MessageResponse {
  message: string
}

// --------------------------------------------------------------------------- //
// Friends
// --------------------------------------------------------------------------- //
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'

export type RelationshipLabel =
  | 'none'
  | 'self'
  | 'friends'
  | 'request_sent'
  | 'request_received'

export interface Friendship {
  id: string
  status: FriendshipStatus
  created_at: string
  responded_at: string | null
  /** The other person, already resolved against the caller. */
  user: User
  is_incoming: boolean
}

export interface FriendSummary {
  friendship_id: string
  user: User
  friends_since: string | null
}

export interface UserSearchResult extends User {
  relationship: RelationshipLabel
}

// --------------------------------------------------------------------------- //
// Groups
// --------------------------------------------------------------------------- //
export type GroupRole = 'owner' | 'admin' | 'member'

export interface GroupMember {
  id: string
  user: User
  role: GroupRole
  joined_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  currency: string
  emoji: string | null
  created_by_id: string
  created_at: string
  member_count: number
  /** The caller's own role, so the UI knows which controls to show. */
  my_role: GroupRole
}

export interface GroupDetail extends Group {
  members: GroupMember[]
}

// --------------------------------------------------------------------------- //
// Expenses
// --------------------------------------------------------------------------- //
export type SplitType = 'equal' | 'exact' | 'percentage'

export const EXPENSE_CATEGORIES = [
  'general',
  'food',
  'groceries',
  'rent',
  'utilities',
  'transport',
  'entertainment',
  'travel',
  'shopping',
  'health',
  'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface ExpenseSplit {
  user: User
  /** Decimal string, e.g. "33.34". Never parsed as a float for arithmetic. */
  amount: string
  percentage: string | null
}

export interface Expense {
  id: string
  group_id: string | null
  description: string
  amount: string
  currency: string
  expense_date: string
  category: ExpenseCategory
  split_type: SplitType
  notes: string | null
  paid_by: User
  created_by: User
  created_at: string
  updated_at: string
  splits: ExpenseSplit[]
  /** What the caller owes on this expense. */
  my_share: string
  /** Positive when the caller is owed, negative when they owe. */
  my_net: string
}

export interface ExpenseListPage {
  items: Expense[]
  total: number
  limit: number
  offset: number
}

export type InvitationStatus = 'pending' | 'accepted' | 'cancelled'

export interface Invitation {
  id: string
  email: string
  status: InvitationStatus
  message: string | null
  created_at: string
  expires_at: string
  accepted_at: string | null
  invited_by: User
  is_expired: boolean
  /**
   * How the server handled the message. `email` means it really went out over
   * SMTP; `console` and `file` mean delivery is stubbed for local development.
   */
  delivery: 'email' | 'console' | 'file'
}

// --------------------------------------------------------------------------- //
// Balances
// --------------------------------------------------------------------------- //
/**
 * Balances are always reported per currency. There is deliberately no combined
 * figure: a net across USD and EUR would be a number with no meaning.
 */
export interface CurrencyTotals {
  currency: string
  owed_to_you: string
  you_owe: string
  net: string
}

export interface PersonBalance {
  user: User
  currency: string
  /** Positive: they owe you. Negative: you owe them. */
  amount: string
}

export interface BalanceOverview {
  totals: CurrencyTotals[]
  people: PersonBalance[]
}

export interface Debt {
  debtor: User
  creditor: User
  amount: string
  currency: string
}

export interface MemberBalance {
  user: User
  currency: string
  /** Positive when the group owes them. */
  net: string
}

export interface GroupBalanceOverview {
  group_id: string
  currency: string
  total_expenses: string
  total_settled: string
  your_share: string
  your_net: string
  members: MemberBalance[]
  /** Real pairwise debts, not simplified. */
  debts: Debt[]
}

export interface SimplifiedPlan {
  currency: string
  transfers: Debt[]
  transfer_count: number
  original_count: number
}

// --------------------------------------------------------------------------- //
// Settlements
// --------------------------------------------------------------------------- //
export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'card',
  'paypal',
  'venmo',
  'upi',
  'other',
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export interface Settlement {
  id: string
  group_id: string | null
  from_user: User
  to_user: User
  created_by: User
  amount: string
  currency: string
  settled_on: string
  method: PaymentMethod
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SettlementListPage {
  items: Settlement[]
  total: number
  limit: number
  offset: number
}

// --------------------------------------------------------------------------- //
// Activity
// --------------------------------------------------------------------------- //
export type ActivityType = 'expense' | 'settlement'

export interface ActivityItem {
  id: string
  type: ActivityType
  occurred_at: string
  actor: User
  /** A rendered sentence, e.g. "Sadiq added Dinner". */
  summary: string
  amount: string
  currency: string
  group: { id: string; name: string; emoji: string | null } | null
  counterparty: User | null
  /** Positive when this left you owed money, negative when owing. */
  your_impact: string
}

export interface ActivityPage {
  items: ActivityItem[]
  total: number
  limit: number
  offset: number
}

// --------------------------------------------------------------------------- //
// Analytics
// --------------------------------------------------------------------------- //
export interface CategorySpending {
  category: ExpenseCategory
  amount: string
  /** Percentage of the window's total, 0-100. */
  share_of_total: string
  expense_count: number
}

export type Granularity = 'daily' | 'monthly'

export interface SeriesPoint {
  /** ISO date for a daily bucket, ISO year-month for a monthly one. */
  bucket: string
  /** First day the bucket covers. */
  start: string
  amount: string
  expense_count: number
}

export interface SpendingSeries {
  granularity: Granularity
  points: SeriesPoint[]
}

export interface GroupRef {
  id: string
  name: string
  emoji: string | null
  currency: string
}

export interface GroupSpending {
  group: GroupRef
  amount: string
}

export interface GroupStatistics {
  group: GroupRef
  total_expenses: string
  your_share: string
  your_net: string
  expense_count: number
  member_count: number
}

export interface Dashboard {
  window: { start: string | null; end: string | null; currency: string }
  /** Your share of expenses in the window — what you consumed, not what you paid. */
  total_spent: string
  expense_count: number
  balances: CurrencyTotals[]
  people: PersonBalance[]
  by_category: CategorySpending[]
  series: SpendingSeries
  by_group: GroupSpending[]
  groups: GroupStatistics[]
  recent_expenses: Expense[]
  recent_settlements: Settlement[]
}
