/**
 * News & Newspapers types — real NewsArticle/NewsSubscription data
 * comes from /api/news/* (see use-articles.ts). Modeled on Publication's
 * real submit->review->publish lifecycle, but admin/editor-authored
 * (no contributor role in this module).
 */

export type NewsArticleStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED'
export type NewsLanguage = 'en' | 'fr' | 'rw'

export interface NewsArticle {
  id: string
  title: string
  content: string
  summary: string
  coverImage?: string | null
  category: string
  language: NewsLanguage
  authorId: string
  authorName: string
  status: NewsArticleStatus
  publishedAt: string | null
  isEdition: boolean
  featured: boolean
  createdAt: string
}

export const articleStatusConfig: Record<NewsArticleStatus, { label: string; cls: string }> = {
  DRAFT:        { label: 'Draft',        cls: 'bg-w-100      text-w-800      border-w-300' },
  SUBMITTED:    { label: 'Submitted',    cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-blue-50   text-blue-800   border-blue-200' },
  APPROVED:     { label: 'Approved',     cls: 'bg-teal-50   text-teal-800   border-teal-200' },
  REJECTED:     { label: 'Rejected',     cls: 'bg-red-50    text-red-800    border-red-200' },
  PUBLISHED:    { label: 'Published',    cls: 'bg-green-50  text-green-800  border-green-200' },
}
