'use client'

import { useState, useEffect } from 'react'
import { Search, BookOpen } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { languageBadgeLabels, type PublishedBook } from './catalog-data'
import { useCatalog } from './use-catalog'
import { CatalogCard } from './catalog-card'

/** Simulated network delay before mock catalog entries become visible. */
const LOAD_DELAY_MS = 400

/** Published Catalog: search + language filter over a responsive card grid. */
export function CatalogView() {
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [languageFilter, setLanguageFilter] = useState<PublishedBook['language'] | 'all'>('all')
  const catalog = useCatalog()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" aria-label="Loading published catalog">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const filtered = catalog.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.contributor.toLowerCase().includes(search.toLowerCase())
    const matchesLanguage = languageFilter === 'all' || b.language === languageFilter
    return matchesSearch && matchesLanguage
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-600" />
          <input
            type="text"
            placeholder="Search title or contributor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search published catalog"
            className="w-full pl-8 pr-4 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
          />
        </div>
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value as PublishedBook['language'] | 'all')}
          aria-label="Filter by language"
          className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
        >
          <option value="all">All Languages</option>
          {(Object.keys(languageBadgeLabels) as PublishedBook['language'][]).map((l) => (
            <option key={l} value={l}>{languageBadgeLabels[l]}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No books found" description="Try a different search term or language filter." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((book) => <CatalogCard key={book.id} book={book} />)}
        </div>
      )}
    </div>
  )
}
