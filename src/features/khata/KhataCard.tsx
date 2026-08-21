import { Archive, ChevronRight, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { formatAbsMoney, toCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Khata } from '@/types/api'

/**
 * One khata in the list.
 *
 * The direction is written as a sentence — "You are owed", "You owe" — because a
 * minus sign is easy to misread, and with money that misreading is expensive.
 */
export function KhataCard({ khata }: { khata: Khata }) {
  const cents = toCents(khata.balance)
  const theyOweYou = cents > 0
  const settled = cents === 0

  return (
    <li>
      <Link
        to={`/khata/${khata.id}`}
        className={cn(
          'flex items-center gap-4 rounded-card bg-white p-4 shadow-sm ring-1 ring-slate-200/70',
          'transition-shadow hover:shadow-md sm:p-5',
          khata.is_archived && 'opacity-60',
        )}
      >
        <Avatar
          name={khata.display_name}
          src={khata.person_user?.avatar_url}
          className="size-11 text-sm"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate font-medium text-slate-900">{khata.display_name}</p>
            {khata.person_user && <Badge tone="brand">on Owsify</Badge>}
            {khata.is_archived && (
              <Badge>
                <Archive aria-hidden className="mr-1 size-3" />
                archived
              </Badge>
            )}
          </div>

          <p
            className={cn(
              'mt-0.5 truncate text-sm',
              settled ? 'text-slate-400' : theyOweYou ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {settled ? (
              'Settled up'
            ) : (
              <>
                {theyOweYou ? 'You are owed ' : 'You owe '}
                <span className="font-semibold tabular-nums">
                  {formatAbsMoney(khata.balance, khata.currency)}
                </span>
              </>
            )}
          </p>

          {khata.person_phone && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400">
              <Phone aria-hidden className="size-3" />
              {khata.person_phone}
            </p>
          )}
        </div>

        <ChevronRight aria-hidden className="size-5 shrink-0 text-slate-300" />
      </Link>
    </li>
  )
}
