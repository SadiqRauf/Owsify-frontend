import {
  Activity,
  BookUser,
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

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: Home },
  { label: 'Khata', to: '/khata', icon: BookUser },
  { label: 'People', to: '/people', icon: UsersRound },
  { label: 'Groups', to: '/groups', icon: Users },
  { label: 'Expenses', to: '/expenses', icon: Receipt },
  { label: 'Settle up', to: '/settlements', icon: Wallet },
  { label: 'Activity', to: '/activity', icon: Activity },
  { label: 'Friends', to: '/friends', icon: User },
]
