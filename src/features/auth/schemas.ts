import { z } from 'zod'

/** Kept in step with the backend's validators in app/schemas/user.py. */
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.')

export const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, 'Enter your name.')
      .max(120, 'Name must be at most 120 characters.'),
    email: z.email('Enter a valid email address.'),
    password,
    confirm_password: z.string().min(1, 'Confirm your password.'),
    currency: z
      .string()
      .trim()
      .length(3, 'Pick a currency.')
      .transform((value) => value.toUpperCase()),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  })

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, 'Enter your name.')
    .max(120, 'Name must be at most 120 characters.'),
  currency: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter currency code, e.g. USD.')
    .transform((value) => value.toUpperCase()),
})

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password.'),
    new_password: password,
    confirm_password: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ProfileValues = z.infer<typeof profileSchema>
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>

/**
 * Choosing a new password from a reset link.
 *
 * Reuses the same `password` rules as registration — a reset must not be a way to
 * set a password the sign-up form would have rejected.
 */
export const resetPasswordSchema = z
  .object({
    new_password: password,
    confirm_password: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  })

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
