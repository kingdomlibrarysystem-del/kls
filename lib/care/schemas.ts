import { z } from 'zod'

export const counselorSchema = z.object({
  name: z.string().trim().min(2, 'Enter the counselor’s name').max(120),
  specialty: z.string().trim().min(2, 'Enter what they help with').max(120),
  bio: z.string().trim().max(2000).nullable().optional(),
  image: z.string().trim().url('Upload a photo again').or(z.literal('')).optional(),
  /** The staff account behind this counselor (so members can message them). */
  userId: z.string().trim().nullable().optional(),
  languages: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  availability: z.string().trim().max(300).nullable().optional(),
  active: z.boolean().optional(),
})

const url = z.string().trim().url('A link is not valid — upload the file again').or(z.literal(''))

export const careResourceSchema = z.object({
  program: z.enum(['COUNSELING', 'REHABILITATION', 'GENERAL']),
  kind: z.enum(['ARTICLE', 'AUDIO', 'VIDEO']),
  title: z.string().trim().min(3, 'Give it a title').max(200),
  summary: z.string().trim().min(10, 'Write a short summary (at least 10 characters)').max(400),
  body: z.string().max(100_000).nullable().optional(),
  mediaUrl: url.nullable().optional(),
  coverImage: url.nullable().optional(),
  topic: z.string().trim().min(2, 'Add a topic, e.g. Anxiety').max(60),
  durationMins: z.number().int().min(1).max(600).nullable().optional(),
  published: z.boolean().optional(),
})
