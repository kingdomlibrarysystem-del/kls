import type { BindingType, MediaType } from '@/app/dashboard/library/_components/resources-data'
import { bindingTypeLabels, mediaTypeLabels } from '@/app/dashboard/library/_components/resources-data'

export type { BindingType, MediaType }
export { bindingTypeLabels, mediaTypeLabels }

/** Published book, per APP_DOC Task 5.1 / Prisma `Publication` (status PUBLISHED). */
export interface PublishedBook {
  id: string
  title: string
  contributor: string
  language: 'en' | 'fr' | 'rw'
  /** One or more cover images — front/back/spine, etc. */
  coverImages: string[]
  /** Longer description, used by the public publication-detail page. Optional — the admin catalog card doesn't render it. */
  description?: string
  /** Whether the book can currently be borrowed, used by the public publication-detail page. Optional — the admin catalog card doesn't render it. */
  available?: boolean
  /** Whether the book is highlighted in featured/curated placements. Admin-toggleable. */
  featured: boolean
  bindingType: BindingType
  mediaType: MediaType
  /** Sale/rental price in RWF. Publishing has no revenue-per-copy simulation yet, so this is currently informational only. */
  price: number
  /** Stock available for lending/sale. Publishing has no inventory-decrement flow yet, so this is currently informational only. */
  quantity: number
}

export const languageBadgeLabels: Record<PublishedBook['language'], string> = {
  en: 'EN',
  fr: 'FR',
  rw: 'RW',
}
