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
  category: z.string().min(1, 'Select a category'),
  isbn: z.string().min(3, 'ISBN is required'),
  totalQty: z.number().int().min(0, 'Must be 0 or more'),
  description: z.string().min(1, 'Description is required'),
  publisher: z.string().min(1, 'Publisher is required'),
  language: z.string().min(1, 'Language is required'),
  pages: z.number().int().min(1, 'Must be at least 1 page'),
  price: z.number().min(0, 'Must be 0 or more'),
  bindingType: z.enum(['SOFT', 'HARD']),
  mediaType: z.enum(['VIDEO', 'DOCUMENT', 'TEXT', 'COMBINATION']),
  /** Comma-separated in the UI, parsed to string[] on submit — see tag-input.tsx. */
  tags: z.array(z.string()),
  /** At least one cover image URL — matches RemoteImage's existing Unsplash-URL convention elsewhere in this app rather than building file upload. */
  coverImage: z.string().min(1, 'A cover image URL is required'),
})

export type ResourceFormData = z.infer<typeof resourceSchema>

export const defaultResourceFormValues: ResourceFormData = {
  title: '',
  author: '',
  category: '',
  isbn: '',
  totalQty: 1,
  description: '',
  publisher: '',
  language: '',
  pages: 1,
  price: 0,
  bindingType: 'SOFT',
  mediaType: 'TEXT',
  tags: [],
  coverImage: '',
}
