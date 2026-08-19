import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { isApiError, setSessionExpiredHandler } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'
import { tokenStorage } from '@/lib/token-storage'
import type { AuthResponse, User } from '@/types/api'

import { authApi } from './api'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'
import type { LoginValues, RegisterValues } from './schemas'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState(() => tokenStorage.hasSession())

  // Keeps this provider in step with logins/logouts in other tabs.
  useEffect(() => tokenStorage.subscribe(() => setHasToken(tokenStorage.hasSession())), [])

  // When a refresh attempt fails, drop the cached user rather than leaving a
  // signed-out app rendering signed-in data.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setHasToken(false)
      queryClient.setQueryData(queryKeys.auth.me, null)
    })
    return () => setSessionExpiredHandler(null)
  }, [queryClient])

  const {
    data: user,
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.me,
    enabled: hasToken,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const applySession = useCallback(
    (response: AuthResponse) => {
      tokenStorage.setTokens(response)
      setHasToken(true)
      queryClient.setQueryData(queryKeys.auth.me, response.user)
      return response.user
    },
    [queryClient],
  )

  const loginMutation = useMutation({
    mutationFn: (values: LoginValues) => authApi.login(values),
  })

  const registerMutation = useMutation({
    mutationFn: (values: RegisterValues) => authApi.register(values),
  })

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // A failed revoke must not trap the user in a signed-in UI; the token still
      // expires on its own, so clearing locally is the right fallback.
      if (!isApiError(error)) throw error
    } finally {
      tokenStorage.clear()
      setHasToken(false)
      queryClient.setQueryData(queryKeys.auth.me, null)
      queryClient.clear()
    }
  }, [queryClient])

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
  }, [queryClient])

  const setUser = useCallback(
    (next: User) => queryClient.setQueryData(queryKeys.auth.me, next),
    [queryClient],
  )

  const status: AuthStatus = useMemo(() => {
    if (!hasToken) return 'unauthenticated'
    if (isLoading || !isFetched) return 'loading'
    return user ? 'authenticated' : 'unauthenticated'
  }, [hasToken, isFetched, isLoading, user])

  const value: AuthContextValue = useMemo(
    () => ({
      user: user ?? null,
      status,
      isAuthenticated: status === 'authenticated',
      isInitializing: status === 'loading',
      login: async (values) => applySession(await loginMutation.mutateAsync(values)),
      register: async (values) => applySession(await registerMutation.mutateAsync(values)),
      logout,
      refreshUser,
      setUser,
    }),
    [applySession, loginMutation, logout, refreshUser, registerMutation, setUser, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
