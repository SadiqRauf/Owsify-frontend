/**
 * Where tokens live between page loads.
 *
 * localStorage is a deliberate trade-off: it survives a refresh and works with a
 * separate API origin, at the cost of being readable by injected scripts. If this
 * ever needs to be hardened, swap this module for httpOnly cookies — nothing else
 * in the app touches storage directly.
 */

import type { TokenPair } from '@/types/api'

const ACCESS_TOKEN_KEY = 'splitwise.access_token'
const REFRESH_TOKEN_KEY = 'splitwise.refresh_token'

type Listener = () => void

const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener())
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    // Private browsing modes can throw on access.
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, value)
    }
  } catch {
    /* Storage unavailable — the session simply won't survive a reload. */
  }
}

export const tokenStorage = {
  getAccessToken: () => read(ACCESS_TOKEN_KEY),
  getRefreshToken: () => read(REFRESH_TOKEN_KEY),

  setTokens(tokens: Pick<TokenPair, 'access_token' | 'refresh_token'>) {
    write(ACCESS_TOKEN_KEY, tokens.access_token)
    write(REFRESH_TOKEN_KEY, tokens.refresh_token)
    notify()
  },

  clear() {
    write(ACCESS_TOKEN_KEY, null)
    write(REFRESH_TOKEN_KEY, null)
    notify()
  },

  hasSession: () => Boolean(read(ACCESS_TOKEN_KEY)),

  /** Fires on local changes and on writes from other tabs. */
  subscribe(listener: Listener) {
    listeners.add(listener)

    const onStorage = (event: StorageEvent) => {
      if (event.key === ACCESS_TOKEN_KEY || event.key === REFRESH_TOKEN_KEY) {
        listener()
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  },
}
