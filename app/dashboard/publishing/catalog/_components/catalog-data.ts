/** Published book, per APP_DOC Task 5.1 / Prisma `Publication` (status PUBLISHED). */
export interface PublishedBook {
  id: string
  title: string
  contributor: string
  language: 'en' | 'fr' | 'rw'
  coverImage: string
  /** Longer description, used by the public publication-detail page. Optional — the admin catalog card doesn't render it. */
  description?: string
  /** Whether the book can currently be borrowed, used by the public publication-detail page. Optional — the admin catalog card doesn't render it. */
  available?: boolean
  /** Whether the book is highlighted in featured/curated placements. Admin-toggleable. */
  featured: boolean
}

// Cover art uses the repo's existing local placeholder images (public/images/)
// rather than an external image service, to avoid depending on a third-party
// domain and to keep next.config.js's image remotePatterns untouched.
const placeholderCovers = ['/images/book-A.jpg', '/images/book-B.jpg', '/images/book-C.jpg']

export const mockCatalog: PublishedBook[] = [
  { id: 'cat-001', title: 'Walking in Covenant',      contributor: 'Pastor Emmanuel Rugamba', language: 'en', coverImage: placeholderCovers[0], description: 'A study of covenant relationship and what it means to walk faithfully within it, drawing on Kingdom Foundation principles.', available: true,  featured: true  },
  { id: 'cat-002', title: 'Marcher dans l’Alliance',    contributor: 'Pastor Emmanuel Rugamba', language: 'fr', coverImage: placeholderCovers[0], description: 'Une étude de la relation d’alliance et de ce que signifie y marcher fidèlement.', available: true,  featured: false },
  { id: 'cat-003', title: 'Kurera Imiryango y’Ubwami', contributor: 'Dr. Alice Mutoni',         language: 'rw', coverImage: placeholderCovers[1], description: 'Inyigisho ku burere bw’imiryango ishingiye ku mahame y’Ubwami.', available: false, featured: false },
  { id: 'cat-004', title: 'The Discipleship Journey',   contributor: 'Elder Samuel Byiringiro',  language: 'en', coverImage: placeholderCovers[2], description: 'A practical guide to walking with new believers from first steps of faith to mature discipleship.', available: true,  featured: true  },
  { id: 'cat-005', title: 'Leading with Humility',       contributor: 'Pastor Emmanuel Rugamba', language: 'en', coverImage: placeholderCovers[1], description: 'On servant leadership and why humility, not position, is the true measure of Kingdom authority.', available: true,  featured: false },
  { id: 'cat-006', title: 'La Discipline Spirituelle',    contributor: 'Dr. Alice Mutoni',         language: 'fr', coverImage: placeholderCovers[2], description: 'Un guide sur les disciplines spirituelles essentielles à la croissance chrétienne.', available: false, featured: false },
]

export const languageBadgeLabels: Record<PublishedBook['language'], string> = {
  en: 'EN',
  fr: 'FR',
  rw: 'RW',
}
