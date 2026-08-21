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
  /** Outstanding across loans you gave them. Cancelled loans excluded. */
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
  loan_count: number
  expense_count: number
  khata_ids: string[]
  /** Currencies you two have money recorded in, most active first. */
  available_currencies: string[]
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

// --------------------------------------------------------------------------- //
// Loans — a fixed principal, paid down by its payments
// --------------------------------------------------------------------------- //

/**
 * All five are derived from the payments and the calendar, never stored — except
 * `cancelled`, which is the one status that is a decision rather than a consequence.
 */
export type LoanStatus =
  | 'active'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'overpaid'
  | 'cancelled'

/** Which way the money went, from the record keeper's side. */
export type LoanDirection = 'given' | 'taken'

export interface LoanPayment {
  id: string
  loan_id: string
  amount: string
  payment_date: string
  note: string | null
  created_at: string
  updated_at: string
}

export interface LoanPaymentWithProgress extends LoanPayment {
  /** What was still outstanding once this payment landed. */
  remaining_after: string
}

export interface Loan {
  id: string
  direction: LoanDirection
  counterparty_name: string
  display_name: string
  counterparty_user: User | null
  amount: string
  currency: string
  due_date: string | null
  description: string | null
  created_at: string
  updated_at: string
  cancelled_at: string | null
  /** Summed from the payments. */
  paid: string
  /** Still owed on the original direction. Never below zero. */
  remaining: string
  /** How much more than the principal came back — money owed the other way now. */
  overpaid: string
  /** Where the loan leaves you both. Positive means they owe you. */
  signed_balance: string
  status: LoanStatus
  payment_count: number
  /** Negative when overdue; null with no due date, or once the loan is closed. */
  days_until_due: number | null
}

export interface LoanDetail extends Loan {
  payments: LoanPayment[]
}

export interface LoanCurrencyTotal {
  currency: string
  lent: string
  borrowed: string
  repaid_to_you: string
  repaid_by_you: string
  /** Total they owe you across all loans. Scoped by sign, not direction. */
  receivable: string
  /** Total you owe them, overpayments included. Scoped by sign. */
  payable: string
  /**
   * Where the loans you gave stand — scoped by direction, so an overpaid loan you
   * gave stays here as a negative rather than moving under the loans you took.
   */
  given_balance: string
  /** Where the loans you took stand. Negative means you owe them. */
  taken_balance: string
  /** given_balance + taken_balance. */
  net: string
  overdue: string
  loan_count: number
  overdue_count: number
}

export interface LoanListPage {
  items: Loan[]
  total: number
  limit: number
  offset: number
  /** Per currency, and unaffected by the filters on the page. */
  totals: LoanCurrencyTotal[]
}

export interface LoanPaymentListPage {
  items: LoanPaymentWithProgress[]
  total: number
  limit: number
  offset: number
  currency: string
  direction: LoanDirection
  loan_amount: string
  paid: string
  remaining: string
  overpaid: string
}

// --------------------------------------------------------------------------- //
// Notes, reminders and the timeline
// --------------------------------------------------------------------------- //
export type NoteSubject = 'khata' | 'loan' | 'person'

/** The subject resolved server-side, so a list renders without a request per row. */
export interface SubjectRef {
  kind: NoteSubject
  id: string
  label: string
  href: string
}

export interface Note {
  id: string
  body: string
  subject: NoteSubject
  subject_ref: SubjectRef
  khata_id: string | null
  loan_id: string | null
  person_user_id: string | null
  created_at: string
  updated_at: string
}

export interface NoteListPage {
  items: Note[]
  total: number
  limit: number
  offset: number
}

export type ReminderStatus = 'upcoming' | 'due_today' | 'overdue' | 'completed'

export interface Reminder {
  id: string
  title: string
  notes: string | null
  /** When the money is expected. */
  due_date: string
  /** When to surface it. Null means "on the due date". */
  remind_on: string | null
  amount: string | null
  currency: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  subject: NoteSubject
  subject_ref: SubjectRef
  khata_id: string | null
  loan_id: string | null
  person_user_id: string | null
  status: ReminderStatus
  days_until_due: number
  /** False while a future remind_on is holding it back. */
  is_surfaced: boolean
}

export interface ReminderCounts {
  open: number
  surfaced: number
  overdue: number
  due_today: number
}

export interface ReminderListPage {
  items: Reminder[]
  total: number
  limit: number
  offset: number
  /** Unaffected by the filters on the page. */
  counts: ReminderCounts
}

export type TimelineKind =
  | 'loan_given'
  | 'loan_taken'
  | 'loan_payment'
  | 'loan_repayment'
  | 'khata_entry'
  | 'expense'
  | 'settlement'
  | 'note'

export interface TimelineEntry {
  id: string
  kind: TimelineKind
  /** The day it happened, not the day it was typed in. */
  occurred_on: string
  occurred_at: string
  title: string
  detail: string | null
  amount: string | null
  currency: string | null
  href: string | null
}

export interface TimelinePage {
  items: TimelineEntry[]
  total: number
  limit: number
  offset: number
  person: User | null
}

// --------------------------------------------------------------------------- //
// Reports — what moved over a window, per currency
// --------------------------------------------------------------------------- //
export interface ReportWindow {
  start_date: string
  end_date: string
  currency: string
  /** A human title, e.g. "August 2026". */
  label: string
}

export interface MoneyFlow {
  money_given: string
  money_received: string
  loans_given: string
  loans_taken: string
  loan_payments: string
  loan_repayments_made: string
  expenses_paid: string
  settlements_in: string
  settlements_out: string
  /** A position as of now, deliberately not windowed. */
  khata_receivable: string
  loans_receivable: string
  loans_payable: string
  net_flow: string
}

export interface SummaryReport {
  window: ReportWindow
  flow: MoneyFlow
  /** Currencies with money recorded in them, most active first. */
  available_currencies: string[]
}

export interface KhataReportRow {
  person_user_id: string | null
  name: string
  khata_id: string | null
  given: string
  received: string
  /** As it stands now, not only within the window. */
  balance: string
  entry_count: number
}

export interface KhataReport {
  window: ReportWindow
  rows: KhataReportRow[]
  totals: { given: string; received: string; balance: string }
}

export interface LoanReportRow {
  loan_id: string
  counterparty_name: string
  direction: LoanDirection
  person_user_id: string | null
  amount: string
  paid: string
  remaining: string
  overpaid: string
  signed_balance: string
  status: LoanStatus
  due_date: string | null
  paid_in_window: string
  given_in_window: boolean
}

export interface LoanReport {
  window: ReportWindow
  rows: LoanReportRow[]
  totals: {
    lent: string
    borrowed: string
    repaid: string
    receivable: string
    payable: string
    net: string
    repaid_in_window: string
    lent_in_window: string
    borrowed_in_window: string
    overdue: string
  }
}

export interface ActivityPoint {
  /** YYYY-MM for monthly, YYYY-MM-DD for daily. */
  period: string
  given: string
  received: string
  lent: string
  repaid: string
}

export interface ActivityReport {
  window: ReportWindow
  granularity: 'daily' | 'monthly'
  points: ActivityPoint[]
}
