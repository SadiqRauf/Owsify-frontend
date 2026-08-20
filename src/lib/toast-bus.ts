/**
 * A module-level channel for toasts.
 *
 * The axios interceptor needs to raise a toast, and it lives outside React — so
 * it cannot call a hook. Rather than pass a setter around, both sides talk to
 * this bus: the interceptor emits, `<ToastProvider>` subscribes and renders.
 */

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastInput {
  tone: ToastTone
  title: string
  description?: string
}

type Listener = (toast: ToastInput) => void

const listeners = new Set<Listener>()

export function emitToast(toast: ToastInput): void {
  listeners.forEach((listener) => listener(toast))
}

export function subscribeToToasts(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
