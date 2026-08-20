import { X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Logo } from '@/components/layout/Logo'
import { NAV_ITEMS } from '@/components/layout/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  /** Controls the slide-over on small screens; ignored from `lg` up. */
  isOpen: boolean
  onClose: () => void
}

function NavItems({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-4">
      {NAV_ITEMS.map(({ label, to, icon: Icon, comingSoon }) =>
        comingSoon ? (
          <span
            key={label}
            aria-disabled
            title="Coming soon"
            className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400"
          >
            <Icon aria-hidden className="size-4.5" />
            {label}
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              Soon
            </span>
          </span>
        ) : (
          <NavLink
            key={label}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <Icon aria-hidden className="size-4.5" />
            {label}
          </NavLink>
        ),
      )}
    </nav>
  )
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/*
        Desktop: pinned to the viewport so it stays put while the page scrolls.
        Sticky rather than fixed, so the aside keeps its place in the flex row and
        the main column still gets its width from the layout instead of needing a
        matching hard-coded offset.
      */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5">
          <Logo />
        </div>
        {/* Scrolls internally only if the nav ever outgrows a short viewport. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavItems onNavigate={() => {}} />
        </div>
      </aside>

      {/* Mobile: slide-over with a backdrop. */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          onClick={onClose}
          className={cn(
            'absolute inset-0 bg-slate-900/40 transition-opacity',
            isOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          aria-hidden={!isOpen}
          className={cn(
            'absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl transition-transform',
            isOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
            <Logo />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <NavItems onNavigate={onClose} />
        </aside>
      </div>
    </>
  )
}
