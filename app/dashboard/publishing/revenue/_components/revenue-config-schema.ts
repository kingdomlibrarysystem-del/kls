import { z } from 'zod'

export const revenueConfigSchema = z
  .object({
    contributorShare: z.number().min(0, 'Must be 0 or more').max(100, 'Must be 100 or less'),
    platformShare: z.number().min(0, 'Must be 0 or more').max(100, 'Must be 100 or less'),
  })
  .refine((data) => data.contributorShare + data.platformShare === 100, {
    message: 'Contributor and platform shares must add up to 100%',
    path: ['platformShare'],
  })

export type RevenueConfigFormData = z.infer<typeof revenueConfigSchema>
