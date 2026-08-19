import { forwardRef, type SelectHTMLAttributes } from 'react'

import { Select } from '@/components/ui/Select'
import { CURRENCIES, CURRENCY_SELECT_OPTIONS } from '@/lib/currencies'

interface CurrencySelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  hint?: string
  /**
   * A code to guarantee is present in the list. The dropdown shows a curated
   * shortlist, but the API accepts every ISO 4217 code — so if an account or group
   * already uses something outside the shortlist, pass it here and the form will
   * show it rather than silently switching them to a different currency.
   *
   * Kept separate from `value` so this works with react-hook-form's uncontrolled
   * `register()`, which never passes `value` down.
   */
  ensureCode?: string
}

export const CurrencySelect = forwardRef<HTMLSelectElement, CurrencySelectProps>(
  function CurrencySelect({ label = 'Currency', ensureCode, ...props }, ref) {
    const isMissing =
      Boolean(ensureCode) && !CURRENCIES.some((currency) => currency.code === ensureCode)

    const options = isMissing
      ? [{ value: ensureCode!, label: ensureCode! }, ...CURRENCY_SELECT_OPTIONS]
      : CURRENCY_SELECT_OPTIONS

    return <Select ref={ref} label={label} options={options} {...props} />
  },
)
