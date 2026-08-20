import { env } from '@/config/env'
import { cn } from '@/lib/utils'

interface LogoProps {
  /**
   * `mark` is the compact form for the app chrome; `lockup` is the larger form
   * for the sign-in and sign-up pages. Both draw the supplied artwork — they
   * differ only in how much room it is given.
   */
  variant?: 'mark' | 'lockup'
  className?: string
}

const WIDTHS = {
  // 200px inside a 256px sidebar with 20px padding either side, which puts the
  // 3.37:1 artwork at roughly 59px tall — just inside the 64px header.
  mark: 'max-w-[160px]',
  lockup: 'max-w-[260px]',
} as const

export function Logo({ variant = 'mark', className }: LogoProps) {
  return (
    <img
      src="/logo-lockup.png"
      /* The artwork is the only thing naming the app in the chrome, so it carries
         the accessible name rather than being hidden — a decorative logo would
         leave a screen reader on a page with no name at all. */
      alt={env.appName}
      width={640}
      height={190}
      className={cn('h-auto w-full', WIDTHS[variant], className)}
    />
  )
}
