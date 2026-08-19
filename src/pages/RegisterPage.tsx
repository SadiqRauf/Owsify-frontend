import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { Input } from '@/components/ui/Input'
import { registerSchema, type RegisterValues } from '@/features/auth/schemas'
import { useAuth } from '@/features/auth/use-auth'
import { getErrorMessage, isApiError } from '@/lib/api-client'
import { DEFAULT_CURRENCY } from '@/lib/currencies'

/** Guess a sensible default from the browser locale, falling back to USD. */
function localeCurrency(): string {
  try {
    const resolved = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })
    return resolved.resolvedOptions().currency ?? DEFAULT_CURRENCY
  } catch {
    return DEFAULT_CURRENCY
  }
}

export function RegisterPage() {
  const { register: createAccount } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formError, setFormError] = useState<string | null>(null)

  // An emailed invitation links here with the address prefilled, so the account
  // is created against the same address the invite was sent to.
  const invitedEmail = searchParams.get('email') ?? ''
  const wasInvited = Boolean(searchParams.get('invite'))

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: invitedEmail,
      password: '',
      confirm_password: '',
      currency: localeCurrency(),
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await createAccount(values)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      if (isApiError(error)) {
        if (error.code === 'email_already_registered') {
          setError('email', { message: error.message })
          return
        }
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          setError(field as keyof RegisterValues, { message })
        }
      }
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <AuthLayout
      title={wasInvited ? 'You have been invited' : 'Create your account'}
      subtitle={
        wasInvited
          ? 'Finish signing up and you will be connected automatically.'
          : 'Split bills with friends without the spreadsheet.'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        {wasInvited && invitedEmail && (
          <Alert tone="info">
            Sign up with <strong>{invitedEmail}</strong> to be connected with whoever invited you.
          </Alert>
        )}

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <CurrencySelect
          label="Default currency"
          hint="You can change this later."
          error={errors.currency?.message}
          {...register('currency')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="At least 8 characters, including a letter and a number."
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
