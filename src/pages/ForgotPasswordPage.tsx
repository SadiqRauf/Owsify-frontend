import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authApi } from '@/features/auth/api'
import { getErrorMessage } from '@/lib/api-client'

const forgotSchema = z.object({
  email: z.email('Enter a valid email address.'),
})

type ForgotValues = z.infer<typeof forgotSchema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await authApi.forgotPassword(values.email)
      // Shown for every address, including ones with no account. The server
      // deliberately answers identically either way so the form cannot be used to
      // discover who has an account here — branching on the response in the UI
      // would give away exactly what the API is careful not to.
      setSent(true)
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  })

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`If ${getValues('email')} has an account, a reset link is on its way. It expires in an hour and can only be used once.`}
      >
        <div className="space-y-5">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50">
            <MailCheck aria-hidden className="size-6 text-emerald-600" />
          </div>

          <Alert tone="info">
            Nothing arrived? Check the spam folder, then try again — asking for a new
            link replaces the old one.
          </Alert>

          <div className="flex flex-col gap-2">
            <Button variant="secondary" fullWidth onClick={() => setSent(false)}>
              Use a different email
            </Button>
            <Link to="/login">
              <Button variant="ghost" fullWidth>
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we will send you a link to choose a new one."
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  )
}
