import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatAbsMoney, toCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Debt, MemberBalance, PersonBalance, User } from '@/types/api'

/**
 * "Ali owes you $50" / "You owe Ahmed $25".
 *
 * Always phrased from the reader's point of view, with the direction in the
 * sentence rather than only in the sign — a minus sign is easy to misread when
 * money is involved.
 */
export function PersonBalanceRow({
  entry,
  onSettle,
}: {
  entry: PersonBalance
  onSettle?: (entry: PersonBalance) => void
}) {
  const cents = toCents(entry.amount)
  const theyOweYou = cents > 0

  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar name={entry.user.full_name} src={entry.user.avatar_url} size="sm" />

      <p className="min-w-0 flex-1 truncate text-sm text-slate-700">
        {theyOweYou ? (
          <>
            <span className="font-medium text-slate-900">{entry.user.full_name}</span> owes you
          </>
        ) : (
          <>
            You owe <span className="font-medium text-slate-900">{entry.user.full_name}</span>
          </>
        )}
      </p>

      <span
        className={cn(
          'text-sm font-semibold tabular-nums',
          theyOweYou ? 'text-emerald-600' : 'text-red-600',
        )}
      >
        {formatAbsMoney(entry.amount, entry.currency)}
      </span>

      {onSettle && (
        <Button size="sm" variant="secondary" onClick={() => onSettle(entry)}>
          Settle up
        </Button>
      )}
    </li>
  )
}

/** Per-member net position inside a group. */
export function MemberBalanceRow({
  entry,
  currentUserId,
}: {
  entry: MemberBalance
  currentUserId?: string
}) {
  const cents = toCents(entry.net)
  const isYou = entry.user.id === currentUserId
  const name = isYou ? 'You' : entry.user.full_name

  return (
    <li className="flex items-center gap-3 py-2.5">
      <Avatar name={entry.user.full_name} src={entry.user.avatar_url} size="sm" />

      <p className="min-w-0 flex-1 truncate text-sm text-slate-700">
        <span className="font-medium text-slate-900">{name}</span>{' '}
        {cents > 0 ? (
          isYou ? 'are owed' : 'is owed'
        ) : cents < 0 ? (
          isYou ? 'owe' : 'owes'
        ) : (
          <span className="text-slate-400">settled up</span>
        )}
      </p>

      {cents !== 0 && (
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            cents > 0 ? 'text-emerald-600' : 'text-red-600',
          )}
        >
          {formatAbsMoney(entry.net, entry.currency)}
        </span>
      )}
    </li>
  )
}

/** A directed debt between two other people, used in group and simplified views. */
export function DebtRow({ debt, currentUserId }: { debt: Debt; currentUserId?: string }) {
  const label = (user: User, capitalise: boolean) =>
    user.id === currentUserId ? (capitalise ? 'You' : 'you') : user.full_name

  return (
    <li className="flex items-center gap-3 py-2.5">
      <Avatar name={debt.debtor.full_name} src={debt.debtor.avatar_url} size="sm" />

      <p className="min-w-0 flex-1 truncate text-sm text-slate-700">
        <span className="font-medium text-slate-900">{label(debt.debtor, true)}</span>
        {debt.debtor.id === currentUserId ? ' owe ' : ' owes '}
        <span className="font-medium text-slate-900">{label(debt.creditor, false)}</span>
      </p>

      <span className="text-sm font-semibold tabular-nums text-slate-900">
        {formatAbsMoney(debt.amount, debt.currency)}
      </span>
    </li>
  )
}
