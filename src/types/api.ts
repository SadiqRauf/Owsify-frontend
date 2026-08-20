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

// --------------------------------------------------------------------------- //
// Khata — a running two-party ledger
// --------------------------------------------------------------------------- //
/**
 * `adjustment` is the only type whose amount may be negative — it is a correction,
 * so it carries its own direction rather than taking one from the type.
 */
export type KhataEntryType = 'given' | 'received' | 'adjustment'

export interface Khata {
  id: string
  /** The name the owner typed. */
  person_name: string
  /** The linked account's name when there is one, else person_name. */
  display_name: string
  person_phone: string | null
  person_email: string | null
  /** Set only when the other party has an account. */
  person_user: User | null
  currency: string
  notes: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
  /** Positive: they owe you. Negative: you owe them. Zero: settled. */
  balance: string
  entry_count: number
  last_entry_on: string | null
}

export interface KhataCurrencyTotal {
  currency: string
  owed_to_you: string
  you_owe: string
  net: string
  khata_count: number
}

export interface KhataListPage {
  items: Khata[]
  total: number
  limit: number
  offset: number
  /** Per currency: rupees and dollars are never added together. */
  totals: KhataCurrencyTotal[]
}

export interface KhataEntry {
  id: string
  khata_id: string
  entry_type: KhataEntryType
  /** Always as entered. Positive for given/received; signed for adjustments. */
  amount: string
  /** Effect on the balance: positive increases what they owe you. */
  signed_amount: string
  entry_date: string
  description: string | null
  created_at: string
  updated_at: string
  /**
   * The balance as it stood after this entry, over the khata's whole history —
   * so it keeps its meaning on page two and under a date filter.
   */
  running_balance: string
}

export interface KhataEntryTotals {
  given: string
  received: string
  adjustment: string
  balance: string
}

export interface KhataEntryListPage {
  items: KhataEntry[]
  total: number
  limit: number
  offset: number
  currency: string
  /** The khata's real balance, unaffected by the filters on the page. */
  balance: string
  totals: KhataEntryTotals
}

// --------------------------------------------------------------------------- //
// People — one person, across groups, settlements and khatas
// --------------------------------------------------------------------------- //
export interface PersonBalanceBreakdown {
  group_balance: string
  khata_balance: string
  /** Always "0.00" — there is no loans feature yet. Reported, not omitted. */
  loan_balance: string
  total_balance: string
  /** Gross settled between you. Context only; already applied to group_balance. */
  settled_total: string
}

export type PersonActivityKind = 'expense' | 'settlement' | 'khata_entry'

export interface PersonActivityItem {
  id: string
  kind: PersonActivityKind
  occurred_at: string
  summary: string
  amount: string
  currency: string
  your_impact: string
  group_id: string | null
  group_name: string | null
  khata_id: string | null
}

export interface PersonSummary {
  person: User
  currency: string
  balances: PersonBalanceBreakdown
  shared_group_count: number
  khata_count: number
  expense_count: number
  khata_ids: string[]
  shared_groups: { id: string; name: string }[]
  recent_activity: PersonActivityItem[]
}

export interface PersonActivityPage {
  items: PersonActivityItem[]
  total: number
  limit: number
  offset: number
}

export interface PersonListItem {
  id: string
  name: string
  email: string | null
  avatar_url: string | null
  /** Null for a khata-only contact, who has no account and so no person page. */
  user: User | null
  khata_id: string | null
  currency: string
  total_balance: string
  has_account: boolean
}

export interface PersonListPage {
  items: PersonListItem[]
  total: number
}
