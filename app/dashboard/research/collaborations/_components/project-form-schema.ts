import { z } from 'zod'

export const projectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  status: z.enum(['ACTIVE', 'COMPLETED', 'SUSPENDED']),
  startDate: z.string().min(1, 'Start date is required'),
  contributorIds: z.array(z.string()).optional(),
})

export type ProjectFormData = z.infer<typeof projectSchema>
