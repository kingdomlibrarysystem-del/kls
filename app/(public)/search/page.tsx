import type { Metadata } from 'next'
import { searchSite, SEARCH_TYPES } from '@/lib/search/query'
import type { SearchSourceType } from '@/lib/search/indexer'
import { SearchResultsView } from './_components/search-results-view'

/**
 * Site search: finds a word or phrase inside every published book (page by
 * page), Life Sciences book, news article, course and lesson
 * (lib/search/query.ts). Results are loaded on the server from the URL
 * (/search?q=corruption&type=BOOK&page=2), so a search can be shared as a link.
 */
export const metadata: Metadata = {
  title: 'Search',
  description: 'Search every book, article and course in the Kingdom Library.',
  // Result pages change with every query — keep them out of Google.
  robots: { index: false, follow: true },
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '', type, page } = await searchParams
  const chosenType = SEARCH_TYPES.includes(type as SearchSourceType) ? (type as SearchSourceType) : null
  const data = q.trim() ? await searchSite(q, { type: chosenType, page: Number(page) || 1 }) : null
  return <SearchResultsView query={q} type={chosenType} data={data} />
}
