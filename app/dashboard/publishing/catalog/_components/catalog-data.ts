/** Published book, per APP_DOC Task 5.1 / Prisma `Publication` (status PUBLISHED). */
export interface PublishedBook {
  id: string
  title: string
  contributor: string
  language: 'en' | 'fr' | 'rw'
  coverImage: string
}

// Cover art uses the repo's existing local placeholder images (public/images/)
// rather than an external image service, to avoid depending on a third-party
// domain and to keep next.config.js's image remotePatterns untouched.
const placeholderCovers = ['/images/book-A.jpg', '/images/book-B.jpg', '/images/book-C.jpg']

export const mockCatalog: PublishedBook[] = [
  { id: 'cat-001', title: 'Walking in Covenant',      contributor: 'Pastor Emmanuel Rugamba', language: 'en', coverImage: placeholderCovers[0] },
  { id: 'cat-002', title: 'Marcher dans l’Alliance',    contributor: 'Pastor Emmanuel Rugamba', language: 'fr', coverImage: placeholderCovers[0] },
  { id: 'cat-003', title: 'Kurera Imiryango y’Ubwami', contributor: 'Dr. Alice Mutoni',         language: 'rw', coverImage: placeholderCovers[1] },
  { id: 'cat-004', title: 'The Discipleship Journey',   contributor: 'Elder Samuel Byiringiro',  language: 'en', coverImage: placeholderCovers[2] },
  { id: 'cat-005', title: 'Leading with Humility',       contributor: 'Pastor Emmanuel Rugamba', language: 'en', coverImage: placeholderCovers[1] },
  { id: 'cat-006', title: 'La Discipline Spirituelle',    contributor: 'Dr. Alice Mutoni',         language: 'fr', coverImage: placeholderCovers[2] },
]

export const languageBadgeLabels: Record<PublishedBook['language'], string> = {
  en: 'EN',
  fr: 'FR',
  rw: 'RW',
}
