import { createContext } from 'react'

import type { User } from '@/types/api'

import type { LoginValues, RegisterValues } from './schemas'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  user: User | null
  status: AuthStatus
  isAuthenticated: boolean
  /** True while the very first `/auth/me` call is resolving. */
  isInitializing: boolean
  login: (values: LoginValues) => Promise<User>
  register: (values: RegisterValues) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
