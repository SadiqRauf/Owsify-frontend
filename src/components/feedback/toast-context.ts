import { createContext } from 'react'

import type { ToastTone } from '@/lib/toast-bus'

export type { ToastTone }

export interface Toast {
  id: string
  tone: ToastTone
  title: string
  description?: string
}

export interface ToastContextValue {
  toast: (input: Omit<Toast, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
