import { apiClient } from '@/lib/api-client'
import { tokenStorage } from '@/lib/token-storage'
import type { AuthResponse, MessageResponse, ResetTokenCheck, User } from '@/types/api'

import type {
  LoginValues,
  PasswordChangeValues,
  ProfileValues,
  RegisterValues,
} from './schemas'

export const authApi = {
  async register(values: RegisterValues): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', {
      email: values.email,
      full_name: values.full_name,
      password: values.password,
      currency: values.currency,
    })
    return data
  },

  async login(values: LoginValues): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', values)
    return data
  },

  /**
   * Always resolves, whatever the address. The server answers identically for a
   * known and an unknown account so the form cannot be used to discover who has
   * one — which means the UI must not branch on the response either.
   */
  async forgotPassword(email: string): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/forgot-password', {
      email,
    })
    return data
  },

  /** Checks a reset link without consuming it, so the page can fail early. */
  async checkResetToken(token: string): Promise<ResetTokenCheck> {
    const { data } = await apiClient.get<ResetTokenCheck>('/auth/reset-password', {
      params: { token },
    })
    return data
  },

  async resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/reset-password', {
      token,
      new_password: newPassword,
    })
    return data
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me')
    return data
  },

  async logout(): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/logout', {
      refresh_token: tokenStorage.getRefreshToken(),
    })
    return data
  },

  async updateProfile(values: ProfileValues): Promise<User> {
    const { data } = await apiClient.patch<User>('/users/me', values)
    return data
  },

  async changePassword(values: PasswordChangeValues): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/users/me/password', {
      current_password: values.current_password,
      new_password: values.new_password,
    })
    return data
  },
}
