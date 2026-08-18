import { z } from 'zod'

/**
 * Full canonical Resource shape, per use-resources.ts/resources-data.ts —
 * previously this form only validated 5 of the ~13 real fields (title,
 * author, category, isbn, totalQty), while the Detail/View modal already
 * displayed and expected the complete shape, silently defaulting every
 * missing field (price, description, publisher, language, pages,
 * bindingType, mediaType, tags, coverImages) to a placeholder value in
 * `library-view.tsx`'s `handleSave` — hence every resource created
 * through the form showing "0 RWF" and an empty description regardless
 * of what an admin actually intended.
 */
export const resourceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  author: z.string().min(2, 'Author is required'),
  /** FK into the canonical KCS taxonomy (`lib/kcs-taxonomy`) — the leaf/scroll category this resource is filed under. */
  categoryId: z.string().min(1, 'Select a category'),
  isbn: z.string().min(3, 'ISBN is required'),
  totalQty: z.number().int().min(0, 'Must be 0 or more'),
  description: z.string().min(1, 'Description is required'),
  publisher: z.string().min(1, 'Publisher is required'),
  language: z.string().min(1, 'Language is required'),
  pages: z.number().int().min(1, 'Must be at least 1 page'),
  price: z.number().min(0, 'Must be 0 or more'),
  /** How many of this resource's chapters (once seeded) are readable free before the reader shows a real "Buy to Continue" paywall — see /api/chapters. Ignored while price is 0. */
  freePreviewChapterCount: z.number().int().min(0, 'Must be 0 or more'),
  bindingType: z.enum(['SOFT', 'HARD']),
  mediaType: z.enum(['VIDEO', 'DOCUMENT', 'TEXT', 'COMBINATION']),
  /** Comma-separated in the UI, parsed to string[] on submit — see tag-input.tsx. */
  tags: z.array(z.string()),
  /**
   * Cover image — either a real Unsplash/remote URL (typed in) or a local
   * blob: URL produced by the file picker (see FilePickerField). No real
   * backend exists in this prototype, so a picked file never leaves the
   * browser; the blob URL is what previews it for the current session.
   */
  coverImage: z.string().min(1, 'A cover image is required'),
  /** Optional document/PDF file — blob: URL from the file picker, no backend to persist it to. */
  documentUrl: z.string().optional(),
  documentName: z.string().optional(),
  /** Optional audio file — blob: URL from the file picker. */
  audioUrl: z.string().optional(),
  audioName: z.string().optional(),
  /** Optional video file — blob: URL from the file picker. */
  videoUrl: z.string().optional(),
  videoName: z.string().optional(),
})

export type ResourceFormData = z.infer<typeof resourceSchema>

export const defaultResourceFormValues: ResourceFormData = {
  title: '',
  author: '',
  categoryId: '',
  isbn: '',
  totalQty: 1,
  description: '',
  publisher: '',
  language: '',
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
}
