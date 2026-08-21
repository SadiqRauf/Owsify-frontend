import {
  Activity,
  BellRing,
  BookUser,
  FileText,
  HandCoins,
  Home,
  Receipt,
  User,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Routes that arrive in a later week are shown but not yet clickable. */
  comingSoon?: boolean
}

export interface NavSection {
  /**
   * Null for the opening group, which carries no heading.
   *
   * Dashboard is not a category of one — labelling it would imply there are other
   * things in it. It sits above the first heading as the way back to the top.
   */
  title: string | null
  items: NavItem[]
}

/**
 * The nav is grouped by **who the money is with**, which is the distinction the app
 * is actually built around: a khata and a loan are one person's private record,
 * while a group expense is a shared one. Those two halves have different rules
 * about ownership and visibility, so keeping them apart in the nav matches the way
 * the rest of the app behaves rather than being decoration.
 *
 * Eleven flat entries had stopped reading as a list. Four short groups is a shape
 * the eye can skip through — and it puts *People* and *Friends* side by side, where
 * their similar names are easiest to tell apart, instead of six rows away from each
 * other.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: null,
    items: [{ label: 'Dashboard', to: '/dashboard', icon: Home }],
  },
  {
    // Your own book about one other person: no shared ownership, no members.
    title: 'Your ledger',
    items: [
      { label: 'Khata', to: '/khata', icon: BookUser },
      { label: 'Loans', to: '/loans', icon: HandCoins },
      { label: 'Reminders', to: '/reminders', icon: BellRing },
    ],
  },
  {
    // Money split with other accounts, where everyone sees the same figures.
    title: 'Shared',
    items: [
      { label: 'Groups', to: '/groups', icon: Users },
      { label: 'Expenses', to: '/expenses', icon: Receipt },
      { label: 'Settle up', to: '/settlements', icon: Wallet },
    ],
  },
  {
    title: 'Contacts',
    items: [
      { label: 'People', to: '/people', icon: UsersRound },
      { label: 'Friends', to: '/friends', icon: User },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', to: '/reports', icon: FileText },
      { label: 'Activity', to: '/activity', icon: Activity },
    ],
  },
]

/** Flat list, for anything that needs every route without the grouping. */
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items)
