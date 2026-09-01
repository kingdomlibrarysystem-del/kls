import { z } from 'zod'

/**
 * Full canonical Resource shape, per use-resources.ts/resources-data.ts.
 * `isbn` is deliberately absent — it's generated server-side (a real
 * unique ISBN-13, see lib/generate-isbn.ts) on create, never entered by
 * an admin. Cover/document/audio/video fields hold real Cloudinary
 * secure_url values from CloudinaryUploadField, not client-only blob:
 * URLs — this form used to accept blob: URLs that never left the
 * browser and were useless once sent to the API.
 */
export const resourceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  author: z.string().min(2, 'Author is required'),
  /** FK into the canonical KCS taxonomy (`lib/kcs-taxonomy`) — the leaf/scroll category this resource is filed under. */
  categoryId: z.string().min(1, 'Select a category'),
  totalQty: z.number().int().min(0, 'Must be 0 or more'),
  description: z.string().min(1, 'Description is required'),
  publisher: z.string().min(1, 'Publisher is required'),
  language: z.string().min(1, 'Language is required'),
  /** Auto-filled from a real extracted PDF page count when a document is uploaded (see /api/uploads); still editable for a resource with no document, or to correct it. */
  pages: z.number().int().min(1, 'Must be at least 1 page'),
  price: z.number().min(0, 'Must be 0 or more'),
  /** How many of this resource's chapters (once seeded) are readable free before the reader shows a real "Buy to Continue" paywall — see /api/chapters. Ignored while price is 0. */
  freePreviewChapterCount: z.number().int().min(0, 'Must be 0 or more'),
  bindingType: z.enum(['SOFT', 'HARD']),
  mediaType: z.enum(['VIDEO', 'AUDIO', 'DOCUMENT', 'TEXT', 'COMBINATION']),
  /** Comma-separated in the UI, parsed to string[] on submit — see tag-input.tsx. */
  tags: z.array(z.string()),
  /** Real Cloudinary secure_url (or a typed-in remote URL) — see CloudinaryUploadField. */
  coverImage: z.string().min(1, 'A cover image is required'),
  documentUrl: z.string().optional(),
  documentName: z.string().optional(),
  audioUrl: z.string().optional(),
  audioName: z.string().optional(),
  videoUrl: z.string().optional(),
  videoName: z.string().optional(),
  /**
   * Client-only — never sent to POST /api/resources directly. When a
   * TEXT (or COMBINATION) resource is created with real markdown typed
   * here, the modal creates a real first Chapter row (via POST
   * /api/chapters) right after the Resource itself, so a text-based
   * resource has real readable content from the moment it's created.
   */
  chapterTitle: z.string().optional(),
  chapterContent: z.string().optional(),
})

export type ResourceFormData = z.infer<typeof resourceSchema>

export const defaultResourceFormValues: ResourceFormData = {
  title: '',
  author: '',
  categoryId: '',
  totalQty: 1,
  description: '',
  publisher: '',
  language: 'EN',
  pages: 1,
  price: 0,
  freePreviewChapterCount: 0,
  bindingType: 'SOFT',
  mediaType: 'TEXT',
  tags: [],
  coverImage: '',
  documentUrl: '',
  documentName: '',
  audioUrl: '',
  audioName: '',
  videoUrl: '',
  videoName: '',
  chapterTitle: '',
  chapterContent: '',
}

/** Common language codes a library resource is realistically authored/translated in — replaces a free-text field prone to inconsistent values (e.g. "english" vs "EN" vs "en-US"). */
export const LANGUAGE_OPTIONS = [
  { code: 'EN', label: 'English' },
  { code: 'FR', label: 'French' },
  { code: 'RW', label: 'Kinyarwanda' },
  { code: 'SW', label: 'Swahili' },
  { code: 'HE', label: 'Hebrew' },
  { code: 'GR', label: 'Greek' },
  { code: 'LA', label: 'Latin' },
  { code: 'AR', label: 'Arabic' },
  { code: 'PT', label: 'Portuguese' },
  { code: 'ES', label: 'Spanish' },
] as const
