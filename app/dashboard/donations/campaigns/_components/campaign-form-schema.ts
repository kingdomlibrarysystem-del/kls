import { z } from 'zod'

export const campaignSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  coverImage: z.string().trim().optional(),
  goalRwf: z.number().positive('Goal must be greater than 0'),
})

export type CampaignFormData = z.infer<typeof campaignSchema>
