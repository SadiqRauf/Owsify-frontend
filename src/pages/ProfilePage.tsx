import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { Input } from '@/components/ui/Input'
import { authApi } from '@/features/auth/api'
import {
  passwordChangeSchema,
  profileSchema,
  type PasswordChangeValues,
  type ProfileValues,
} from '@/features/auth/schemas'
import { useAuth } from '@/features/auth/use-auth'
import { getErrorMessage, isApiError } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'

function ProfileForm() {
  const { user, setUser } = useAuth()
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? '',
      currency: user?.currency ?? 'USD',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null)
    try {
      const updated = await authApi.updateProfile(values)
      setUser(updated)
      reset({ full_name: updated.full_name, currency: updated.currency })
      setStatus({ tone: 'success', message: 'Profile updated.' })
    } catch (error) {
      if (isApiError(error)) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          setError(field as keyof ProfileValues, { message })
        }
      }
      setStatus({ tone: 'error', message: getErrorMessage(error) })
    }
  })

  return (
    <Card title="Profile" description="How you appear to the people you split with.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {status && <Alert tone={status.tone}>{status.message}</Alert>}

        <div className="flex items-center gap-4">
          <Avatar name={user?.full_name ?? '?'} src={user?.avatar_url} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{user?.email}</p>
            <p className="text-xs text-slate-500">
              Joined {user ? formatDate(user.created_at) : '—'}
            </p>
          </div>
        </div>

        <Input label="Full name" error={errors.full_name?.message} {...register('full_name')} />

        <CurrencySelect
          label="Default currency"
          hint="Used for new personal expenses and your overall balance."
          ensureCode={user?.currency}
          error={errors.currency?.message}
          {...register('currency')}
        />

        <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: PasswordChangeValues) => authApi.changePassword(values),
    onSuccess: async () => {
      // The backend revokes every session on a password change, so sign out cleanly
      // instead of letting the next request fail with a stale token.
      setStatus({ tone: 'success', message: 'Password updated. Signing you out…' })
      await logout()
      navigate('/login', { replace: true })
    },
    onError: (error) => {
      if (isApiError(error)) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          setError(field as keyof PasswordChangeValues, { message })
        }
      }
      setStatus({ tone: 'error', message: getErrorMessage(error) })
    },
  })

  const onSubmit = handleSubmit((values) => {
    setStatus(null)
    mutation.mutate(values)
  })

  return (
    <Card title="Password" description="Changing this signs you out of every device.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {status && <Alert tone={status.tone}>{status.message}</Alert>}

        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.current_password?.message}
          {...register('current_password')}
        />

        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, including a letter and a number."
          error={errors.new_password?.message}
          {...register('new_password')}
        />

        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <Button type="submit" isLoading={mutation.isPending}>
          Update password
        </Button>
      </form>
    </Card>
  )
}

export function ProfilePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Account</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your details and sign-in security.</p>
      </header>

      <ProfileForm />
      <PasswordForm />
    </div>
  )
}
