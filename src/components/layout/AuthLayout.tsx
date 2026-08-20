import type { ReactNode } from 'react'

import { Logo } from '@/components/layout/Logo'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/** Centred card used by the sign-in and sign-up pages. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo variant="lockup" />
        </div>

        <div className="rounded-card bg-white p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
          <header className="mb-6 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </header>

          {children}
        </div>

        {footer && <div className="mt-5 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  )
}
