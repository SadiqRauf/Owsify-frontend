import { z } from 'zod'

export const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Give the group a name.')
    .max(120, 'Name must be at most 120 characters.'),
  description: z.string().trim().max(2000, 'Description is too long.').optional(),
  currency: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter currency code, e.g. USD.')
    .transform((value) => value.toUpperCase()),
  emoji: z.string().trim().max(8).optional(),
})

export type GroupValues = z.infer<typeof groupSchema>
