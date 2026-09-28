/** Binding type per the canonical Book shape — physical books are soft or hard cover. */
export type BindingType = 'SOFT' | 'HARD'

/** Media type per the canonical Book shape — matches APP_DOC's resource-type concept (Prisma ResourceType/ResourceFormat). */
export type MediaType = 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'TEXT' | 'COMBINATION'

/** Digital library resource — a "scroll" categorized under a KCS section. Also the canonical Book shape read by the public library browse/detail pages. */
export interface Resource {
  id: string
  title: string
  author: string
  publisher: string
  /** FK into the canonical KCS taxonomy (`lib/kcs-taxonomy`) — the category/scroll this resource is filed under. Replaces the old free-text `category: string`. */
  categoryId: string
  type: string
  format: string
  language: string
  year: number
  pages: number
  isbn: string
  /** Reserve (SALE/"Buy") price only — Borrow uses borrowPrice instead. */
  price: number
  /** Real Borrow (RENTAL) charge, independent from `price`. */
  borrowPrice: number
  /** Days from borrowDate to dueDate for a Borrow of this resource — see Resource.borrowDurationDays's schema docstring. */
  borrowDurationDays: number
  /** How many of this resource's chapters are readable for free before the reader shows a real paywall (see /api/chapters). Ignored while price is 0. */
  freePreviewChapterCount: number
  /** Renamed conceptually to "quantity" per the canonical shape; totalQty/availableQty split is kept since it's strictly more useful than one combined count. */
  totalQty: number
  availableQty: number
  status: 'available' | 'out_of_stock' | 'archived'
  /** One or more cover images — a physical book may have front/back/spine shots. */
  coverImages: string[]
  bindingType: BindingType
  mediaType: MediaType
  description: string
  tags: string[]
  /** The actual document/PDF file for this resource, when mediaType includes text content. Optional — physical-only scrolls have none. */
  documentUrl?: string
  /** The actual audio file for this resource, when mediaType includes an audio component. */
  audioUrl?: string
  /** The actual video file for this resource, when mediaType includes a video component. */
  videoUrl?: string
  /** Denormalized from real Review rows (see /api/reviews) — 0 when reviewCount is 0, not a placeholder. */
  avgRating: number
  reviewCount: number
  /** How many real Chapter rows this resource has — the readable content of a TEXT book (see /api/chapters). A resource is readable online when this is > 0 OR documentUrl is set, which is what gates the Read button. */
  chapterCount: number
}

export const statusConfig: Record<Resource['status'], { label: string; cls: string }> = {
  available: { label: 'Available', cls: 'bg-green-50 text-green-800 border-green-200' },
  out_of_stock: { label: 'Out of Stock', cls: 'bg-red-50   text-red-800   border-red-200' },
  archived: { label: 'Archived', cls: 'bg-w-100    text-w-600     border-w-300' },
}

export const bindingTypeLabels: Record<BindingType, string> = {
  SOFT: 'Softcover',
  HARD: 'Hardcover',
}

export const mediaTypeLabels: Record<MediaType, string> = {
  VIDEO: 'Video',
  AUDIO: 'Audio',
  DOCUMENT: 'Document',
  TEXT: 'Text',
  COMBINATION: 'Combination',
}

/**
 * Whether a resource has anything at all to read online — an uploaded PDF
 * (documentUrl) or real authored chapters (chapterCount). This is the single
 * definition of "readable" shared by the admin inventory table, the public
 * publication page and the member detail pages, so a Read button can never
 * appear for a book the reader would then refuse to open.
 *
 * Both branches matter: gating on documentUrl alone hid Read on every TEXT
 * book (chapters, no PDF), and gating on chapterCount alone would have hidden
 * it on every uploaded-PDF book, which is the majority of the catalog.
 */
export function isResourceReadable(r: Pick<Resource, 'documentUrl' | 'chapterCount'>): boolean {
  return !!r.documentUrl || r.chapterCount > 0
}
