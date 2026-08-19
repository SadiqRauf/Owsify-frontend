import {
  Bus,
  Clapperboard,
  Heart,
  Home,
  Lightbulb,
  Plane,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth/use-auth'
import { formatAbsMoney, isZero, toCents } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import type { Expense, ExpenseCategory } from '@/types/api'

const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  general: Receipt,
  food: Utensils,
  groceries: ShoppingCart,
  rent: Home,
  utilities: Lightbulb,
  transport: Bus,
  entertainment: Clapperboard,
  travel: Plane,
  shopping: ShoppingBag,
  health: Heart,
  other: Receipt,
}

/** One row: what it was, who paid, and what it does to your balance. */
export function ExpenseRow({ expense }: { expense: Expense }) {
  const { user } = useAuth()
  const Icon = CATEGORY_ICONS[expense.category] ?? Receipt

  const net = toCents(expense.my_net)
  const paidByYou = expense.paid_by.id === user?.id

  return (
    <li>
      <Link
        to={`/expenses/${expense.id}`}
        className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-slate-50"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Icon aria-hidden className="size-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{expense.description}</p>
          <p className="truncate text-xs text-slate-500">
            {paidByYou ? 'You' : expense.paid_by.full_name} paid{' '}
            {formatAbsMoney(expense.amount, expense.currency)} · {formatDate(expense.expense_date)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {isZero(expense.my_net) ? (
            <p className="text-xs text-slate-400">not involved</p>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                {net > 0 ? 'you lent' : 'you borrowed'}
              </p>
              <p
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  net > 0 ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                {formatAbsMoney(expense.my_net, expense.currency)}
              </p>
            </>
          )}
        </div>
      </Link>
    </li>
  )
}

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {expenses.map((expense) => (
        <ExpenseRow key={expense.id} expense={expense} />
      ))}
    </ul>
  )
}
