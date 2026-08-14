'use client'

import { useState } from 'react'
import { Search, BookOpen, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { languageBadgeLabels, type PublishedBook } from './catalog-data'
import { usePublications } from '../../_shared/use-publications'
import { CatalogCard } from './catalog-card'
import { CatalogStats } from './catalog-stats'

/** Published Catalog: search + language filter over a responsive card grid. Reads real Publication rows filtered to status PUBLISHED — a published Publication IS the catalog entry now. */
export function CatalogView() {
  const [search, setSearch] = useState('')
  const [languageFilter, setLanguageFilter] = useState<PublishedBook['language'] | 'all'>('all')
  const { data: publications, loading, error } = usePublications()
  const catalog: PublishedBook[] = publications
    .filter((p) => p.status === 'PUBLISHED')
    .map((p) => ({
      id: p.id,
      title: p.title,
      contributor: p.contributor,
      language: p.language,
      coverImages: p.coverImage ? [p.coverImage] : [],
      description: p.description,
      available: true,
      featured: p.featured,
      bindingType: p.bindingType ?? 'SOFT',
      mediaType: p.mediaType ?? 'TEXT',
      price: p.price ?? 0,
      quantity: p.quantity ?? 0,
    }))

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" aria-label="Loading published catalog">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load the published catalog" description={error} />
  }

  const filtered = catalog.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.contributor.toLowerCase().includes(search.toLowerCase())
    const matchesLanguage = languageFilter === 'all' || b.language === languageFilter
    return matchesSearch && matchesLanguage
  })

  return (
    <div>
      <CatalogStats data={catalog} />

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
