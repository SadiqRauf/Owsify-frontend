import { ChevronDown, LogOut, Menu, User as UserIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/use-auth'
import { NotificationBell } from '@/features/notifications/NotificationBell'

export function Navbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on an outside click or Escape, the two things users expect from a menu.
  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setIsSigningOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setIsSigningOut(false)
      setMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      <div className="ml-auto">
        <NotificationBell />
      </div>

      <div ref={menuRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100"
          >
            <Avatar name={user?.full_name ?? '?'} src={user?.avatar_url} size="sm" />
            <span className="hidden text-sm font-medium text-slate-700 sm:block">
              {user?.full_name}
            </span>
            <ChevronDown aria-hidden className="size-4 text-slate-400" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200"
            >
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-900">{user?.full_name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>

              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserIcon aria-hidden className="size-4" />
                Profile
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                <LogOut aria-hidden className="size-4" />
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
