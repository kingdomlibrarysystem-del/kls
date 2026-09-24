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
  align?: 'left' | 'center' | 'right' | 'justify'
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

/** Row shape of /api/news/categories (NewsArticleCategory). */
export interface NewsCategoryInfo {
  id: string
  name: string
  description?: string | null
  color?: string | null
  createdAt?: string
}

/** Used when an article's category text has no matching row/color yet (legacy free-text values predating the category collection). */
export const DEFAULT_CATEGORY_COLOR = '#f59e0b'

/** Preset swatches admins can pick from — reuse the seed palette so new categories match the shipped look. */
export const CATEGORY_COLOR_PRESETS = [
  '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#6366f1',
  '#ec4899', '#14b8a6', '#22c55e', '#06b6d4', '#a855f7', '#ef4444',
]

/** DB-driven replacement for the old hard-coded name->color maps in the member feed and article reading view. */
export function resolveCategoryColor(category: string, categories: NewsCategoryInfo[]): string {
  return categories.find((c) => c.name === category)?.color || DEFAULT_CATEGORY_COLOR
}
