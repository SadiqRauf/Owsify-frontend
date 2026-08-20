/**
 * The single axios instance every request goes through.
 *
 * Two things happen here that the rest of the app never has to think about:
 *   1. the access token is attached to outgoing requests, and
 *   2. a 401 triggers one refresh attempt, with concurrent requests queued behind
 *      it so a burst of parallel calls produces exactly one refresh.
 */

import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

import { env } from '@/config/env'
import { resolveSuccessToast } from '@/lib/mutation-toasts'
import { emitToast } from '@/lib/toast-bus'
import { tokenStorage } from '@/lib/token-storage'
import type { ApiErrorBody, ApiErrorDetail, TokenPair } from '@/types/api'

/** Endpoints that must never trigger a refresh — failing them *is* the answer. */
const AUTH_FREE_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/token']

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
})

/** Raised for every non-2xx response, with the backend's error envelope unpacked. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: ApiErrorDetail[]
  readonly requestId: string | null

  constructor(
    message: string,
    options: {
      status: number
      code: string
      details?: ApiErrorDetail[]
      requestId?: string | null
    },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.details = options.details ?? []
    this.requestId = options.requestId ?? null
  }

  /** True when the server rejected specific fields, so a form can show them inline. */
  get isValidationError() {
    return this.status === 422 || this.details.length > 0
  }

  get isNetworkError() {
    return this.status === 0
  }

  /** Field-name -> message, ready to hand to react-hook-form's setError. */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries(
      this.details
        .filter((detail): detail is ApiErrorDetail & { field: string } => Boolean(detail.field))
        .map((detail) => [detail.field, detail.message]),
    )
  }
}

function toApiError(error: AxiosError<ApiErrorBody>): ApiError {
  if (!error.response) {
    return new ApiError(
      error.code === 'ECONNABORTED'
        ? 'The request timed out. Please try again.'
        : 'Could not reach the server. Check your connection and try again.',
      { status: 0, code: 'network_error' },
    )
  }

  const { status, data } = error.response
  const body = data?.error

  return new ApiError(body?.message ?? error.message ?? 'Something went wrong.', {
    status,
    code: body?.code ?? 'http_error',
    details: body?.details,
    requestId: data?.request_id ?? null,
  })
}

// --------------------------------------------------------------------------- //
// Request: attach the access token
// --------------------------------------------------------------------------- //
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --------------------------------------------------------------------------- //
// Response: refresh once on 401, replaying whatever was in flight
// --------------------------------------------------------------------------- //
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

let refreshInFlight: Promise<string> | null = null

/** Called when refreshing fails, so the app can drop its auth state. */
let onSessionExpired: (() => void) | null = null

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) {
    throw new ApiError('Your session has expired. Please sign in again.', {
      status: 401,
      code: 'session_expired',
    })
  }

  // A bare axios call, not apiClient, so this request skips these interceptors.
  const { data } = await axios.post<TokenPair>(
    `${env.apiUrl}/auth/refresh`,
    { refresh_token: refreshToken },
    { headers: { 'Content-Type': 'application/json' }, timeout: 20_000 },
  )

  tokenStorage.setTokens(data)
  return data.access_token
}

apiClient.interceptors.response.use(
  (response) => {
    // Confirm every successful write here rather than at 24 call sites. A rule per
    // component is a rule that gets forgotten, and a silent success looks
    // identical to a request that never left the browser.
    const method = response.config.method ?? ''
    const url = response.config.url ?? ''
    const toast = resolveSuccessToast(method, url)
    if (toast) {
      emitToast({ tone: 'success', title: toast.title, description: toast.description })
    }
    return response
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const path = config?.url ?? ''

    const shouldRefresh =
      status === 401 &&
      config &&
      !config._retried &&
      !AUTH_FREE_PATHS.some((authPath) => path.includes(authPath)) &&
      Boolean(tokenStorage.getRefreshToken())

    if (!shouldRefresh) {
      return Promise.reject(toApiError(error))
    }

    config._retried = true

    try {
      // Every caller that arrives while a refresh is running awaits the same promise.
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null
      })
      const accessToken = await refreshInFlight

      config.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(config)
    } catch {
      tokenStorage.clear()
      onSessionExpired?.()
      return Promise.reject(
        new ApiError('Your session has expired. Please sign in again.', {
          status: 401,
          code: 'session_expired',
        }),
      )
    }
  },
)

/** Narrowing helper for `catch` blocks and query error rendering. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
