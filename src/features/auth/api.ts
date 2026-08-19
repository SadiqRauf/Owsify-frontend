import { apiClient } from '@/lib/api-client'
import { tokenStorage } from '@/lib/token-storage'
import type { AuthResponse, MessageResponse, User } from '@/types/api'

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
