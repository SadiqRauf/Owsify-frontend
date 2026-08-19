import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { useAuth } from '@/features/auth/use-auth'
import { getErrorMessage, isApiError } from '@/lib/api-client'

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? '/dashboard'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (isApiError(error) && error.isValidationError) {
        // Surface per-field messages the backend rejected, e.g. a malformed email.
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          setError(field as keyof LoginValues, { message })
        }
      }
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to keep your shared expenses in order."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:text-brand-800">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
