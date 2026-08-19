import { Home, Receipt, User, Users, Wallet, type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Routes that arrive in later weeks are shown but not yet clickable. */
  comingSoon?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: Home },
  { label: 'Groups', to: '/groups', icon: Users },
  { label: 'Expenses', to: '/expenses', icon: Receipt },
  { label: 'Friends', to: '/friends', icon: User },
  { label: 'Settle up', to: '/settlements', icon: Wallet, comingSoon: true },
]
