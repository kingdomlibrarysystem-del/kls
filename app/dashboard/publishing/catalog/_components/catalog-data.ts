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

// Cover art uses the repo's existing local placeholder images (public/images/)
// rather than an external image service, to avoid depending on a third-party
// domain and to keep next.config.js's image remotePatterns untouched.
const placeholderCovers = ['/images/book-A.jpg', '/images/book-B.jpg', '/images/book-C.jpg']

export const mockCatalog: PublishedBook[] = [
  { id: 'cat-001', title: 'Walking in Covenant',      contributor: 'Pastor Emmanuel Rugamba', language: 'en', coverImages: [placeholderCovers[0]], description: 'A study of covenant relationship and what it means to walk faithfully within it, drawing on Kingdom Foundation principles.', available: true,  featured: true,  bindingType: 'HARD', mediaType: 'TEXT', price: 6500, quantity: 24 },
  { id: 'cat-002', title: 'Marcher dans l’Alliance',    contributor: 'Pastor Emmanuel Rugamba', language: 'fr', coverImages: [placeholderCovers[0]], description: 'Une étude de la relation d’alliance et de ce que signifie y marcher fidèlement.', available: true,  featured: false, bindingType: 'SOFT', mediaType: 'TEXT', price: 6500, quantity: 15 },
  { id: 'cat-003', title: 'Kurera Imiryango y’Ubwami', contributor: 'Dr. Alice Mutoni',         language: 'rw', coverImages: [placeholderCovers[1]], description: 'Inyigisho ku burere bw’imiryango ishingiye ku mahame y’Ubwami.', available: false, featured: false, bindingType: 'SOFT', mediaType: 'TEXT', price: 5000, quantity: 0  },
  { id: 'cat-004', title: 'The Discipleship Journey',   contributor: 'Elder Samuel Byiringiro',  language: 'en', coverImages: [placeholderCovers[2]], description: 'A practical guide to walking with new believers from first steps of faith to mature discipleship.', available: true,  featured: true,  bindingType: 'HARD', mediaType: 'COMBINATION', price: 7000, quantity: 18 },
  { id: 'cat-005', title: 'Leading with Humility',       contributor: 'Pastor Emmanuel Rugamba', language: 'en', coverImages: [placeholderCovers[1]], description: 'On servant leadership and why humility, not position, is the true measure of Kingdom authority.', available: true,  featured: false, bindingType: 'SOFT', mediaType: 'TEXT', price: 5500, quantity: 30 },
  { id: 'cat-006', title: 'La Discipline Spirituelle',    contributor: 'Dr. Alice Mutoni',         language: 'fr', coverImages: [placeholderCovers[2]], description: 'Un guide sur les disciplines spirituelles essentielles à la croissance chrétienne.', available: false, featured: false, bindingType: 'SOFT', mediaType: 'TEXT', price: 5000, quantity: 0  },
]

export const languageBadgeLabels: Record<PublishedBook['language'], string> = {
  en: 'EN',
  fr: 'FR',
  rw: 'RW',
}
