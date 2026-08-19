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

export interface BalanceEntry {
  user: User
  /** Positive: they owe you. Negative: you owe them. */
  amount: string
  currency: string
}

export interface BalanceSummary {
  currency: string
  total_owed_to_you: string
  total_you_owe: string
  net: string
  entries: BalanceEntry[]
}
