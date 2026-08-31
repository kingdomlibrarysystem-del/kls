import { z } from 'zod'

export const systemSettingsSchema = z.object({
  defaultBorrowPeriodDays: z.number().int('Must be a whole number').min(1, 'Must be at least 1 day').max(90, 'Must be 90 days or fewer'),
  maxRenewals: z.number().int('Must be a whole number').min(0, 'Cannot be negative').max(10, 'Must be 10 or fewer'),
  reservationClaimWindowHours: z.number().int('Must be a whole number').min(1, 'Must be at least 1 hour').max(168, 'Must be 168 hours (7 days) or fewer'),
  maxConcurrentBorrows: z.number().int('Must be a whole number').min(1, 'Must be at least 1').max(20, 'Must be 20 or fewer'),
  borrowingFee: z.number().min(0, 'Cannot be negative').max(1000000, 'Must be 1,000,000 RWF or fewer'),
  reservationFee: z.number().min(0, 'Cannot be negative').max(1000000, 'Must be 1,000,000 RWF or fewer'),
})

export type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>

export const defaultSystemSettings: SystemSettingsFormData = {
  defaultBorrowPeriodDays: 14,
  maxRenewals: 2,
  reservationClaimWindowHours: 48,
  maxConcurrentBorrows: 3,
  borrowingFee: 0,
  reservationFee: 0,
}
