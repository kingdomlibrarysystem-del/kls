import { z } from 'zod'
import type { MediaCapabilities } from '@/lib/media-types-shared'

/**
 * The book fields a publisher fills in (POST /api/publications and the
 * `update` action of PATCH /api/publications/[id]). A draft only needs a
 * title; `missingForSubmit` lists what must be present before it can go to
 * review.
 */
const url = z.string().trim().url('Upload the file again — the link is not valid').or(z.literal(''))

export const MAX_CHAPTERS = 300
export const MAX_CHAPTER_LENGTH = 200_000

const chapterSchema = z.object({
  title: z.string().trim().max(200),
  body: z.string().max(MAX_CHAPTER_LENGTH, 'A chapter is too long'),
})

export const bookFieldsSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  author: z.string().trim().max(120).optional(),
  description: z.string().trim().max(5000).optional(),
  categoryId: z.string().trim().optional(),
  language: z.enum(['en', 'fr', 'rw', 'EN', 'FR', 'RW']).optional(),
  mediaType: z.string().trim().optional(),
  coverImage: url.optional(),
  documentUrl: url.optional(),
  audioUrl: url.optional(),
  videoUrl: url.optional(),
  /** Written chapters, for a media type that allows chapters (Text). Empty rows are dropped. */
  chapters: z.array(chapterSchema).max(MAX_CHAPTERS, `At most ${MAX_CHAPTERS} chapters`).optional(),
  pages: z.number().int().min(0).max(100_000).optional(),
  price: z.number().min(0).max(100_000_000).optional(),
  borrowPrice: z.number().min(0).max(100_000_000).optional(),
  quantity: z.number().int().min(0).max(100_000).optional(),
})

export type BookFields = z.infer<typeof bookFieldsSchema>

export const createPublicationSchema = bookFieldsSchema.extend({
  /** true = send for review now; false/absent = save as draft. */
  submit: z.boolean().optional(),
})

/** Drops chapters with neither a title nor text, and names untitled ones "Chapter N". */
export function cleanChapters(chapters: { title: string; body: string }[] | undefined) {
  return (chapters ?? [])
    .filter((c) => c.title.trim() || c.body.trim())
    .map((c, i) => ({ title: c.title.trim() || `Chapter ${i + 1}`, body: c.body }))
}

interface SubmitCheck {
  categoryId?: string | null
  description?: string | null
  coverImage?: string | null
  mediaType?: string | null
  documentUrl?: string | null
  audioUrl?: string | null
  videoUrl?: string | null
  chapters?: { title: string; body: string }[] | null
}

/**
 * What a book must have before it can be submitted for review — returns the
 * first problem, or null. Content must match the media type: written chapters
 * for a chapters type, or at least one uploaded file the type allows.
 */
export function missingForSubmit(b: SubmitCheck, caps: MediaCapabilities): string | null {
  if (!b.categoryId) return 'Choose the KCS category the book belongs to'
  if (!b.mediaType) return 'Choose the media type'
  if (!b.description || b.description.trim().length < 20) return 'Add a description (at least 20 characters)'
  if (!b.coverImage) return 'Upload a cover image'
  const hasChapters = caps.allowsChapters && (b.chapters ?? []).some((c) => c.body.trim().length > 0)
  const hasFile = (caps.allowsDocument && !!b.documentUrl) || (caps.allowsAudio && !!b.audioUrl) || (caps.allowsVideo && !!b.videoUrl)
  if (!hasChapters && !hasFile) {
    const needs = [
      caps.allowsChapters && 'write at least one chapter',
      caps.allowsDocument && 'upload the PDF',
      caps.allowsAudio && 'upload the audio',
      caps.allowsVideo && 'upload the video',
    ].filter(Boolean)
    return `Add the book's content: ${needs.join(' or ')}`
  }
  return null
}
