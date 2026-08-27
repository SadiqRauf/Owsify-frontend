import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { CardSkeleton } from '@/components/feedback/Skeleton'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authApi } from '@/features/auth/api'
import { resetPasswordSchema, type ResetPasswordValues } from '@/features/auth/schemas'
import { getErrorMessage, isApiError } from '@/lib/api-client'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  /*
    The link is checked before the form is shown: making someone choose and confirm
    a password only to be told the link expired is a poor trade for one cheap
    request.

    A query rather than an effect, because that is what this is — server state keyed
    by the token. Doing it by hand meant a setState inside an effect, cascading
    renders, and hand-rolled cancellation on top.
  */
  const check = useQuery({
    queryKey: ['auth', 'reset-token', token],
    queryFn: () => authApi.checkResetToken(token),
    enabled: Boolean(token),
    // A reset link is single-use and short-lived; a cached "valid" from a minute
    // ago is not worth reusing, and retrying a rejected token achieves nothing.
    retry: false,
    gcTime: 0,
    staleTime: 0,
  })

  const checking = Boolean(token) && check.isPending
  const linkValid = check.data?.valid === true
  const linkEmail = check.data?.email ?? null

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await authApi.resetPassword(token, values.new_password)
      setDone(true)
    } catch (error) {
      if (isApiError(error)) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          setError(field as keyof ResetPasswordValues, { message })
        }
      }
      setFormError(getErrorMessage(error))
    }
  })

  if (checking) {
    return (
      <AuthLayout title="Checking your link" subtitle="One moment.">
        <CardSkeleton lines={3} />
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout
        title="Password changed"
        /* Said plainly, because it is surprising otherwise: the reset signs every
           device out, which is the point when the reason for it was a compromise. */
        subtitle="You have been signed out everywhere, on every device. Sign in again with your new password."
      >
        <div className="space-y-5">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 aria-hidden className="size-6 text-emerald-600" />
          </div>
          <Button
            fullWidth
            size="lg"
            onClick={() => navigate('/login', { replace: true })}
          >
            Go to sign in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  if (!token || !linkValid) {
    return (
      <AuthLayout
        title="This link no longer works"
        subtitle="Reset links expire after an hour, can only be used once, and are replaced whenever a newer one is requested. Ask for a fresh one and it will work."
        footer={
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        }
      >
        <div className="space-y-5">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50">
            <ShieldAlert aria-hidden className="size-6 text-amber-600" />
          </div>
          <Link to="/forgot-password" className="block">
            <Button fullWidth size="lg">
              Send a new link
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle={
        linkEmail
          ? `For ${linkEmail}.`
          : 'Pick something you have not used here before.'
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          autoFocus
          error={errors.new_password?.message}
          hint="At least 8 characters, with a letter and a number."
          {...register('new_password')}
        />

        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          Change password
        </Button>

        <p className="text-center text-xs text-slate-400">
          Changing your password signs you out on every device.
        </p>
      </form>
    </AuthLayout>
  )
}
