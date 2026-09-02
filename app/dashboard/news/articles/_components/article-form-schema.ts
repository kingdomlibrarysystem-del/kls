import { z } from 'zod'

export const articleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  summary: z.string().min(1, 'Summary is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  coverImage: z.string().trim().optional(),
  language: z.enum(['EN', 'FR', 'RW']),
  isEdition: z.boolean(),
})

export type ArticleFormData = z.infer<typeof articleSchema>
