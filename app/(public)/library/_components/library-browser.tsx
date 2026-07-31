'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, BookOpen, X, AlertTriangle } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { mediaTypeLabels, type Resource } from '@/app/dashboard/library/_components/resources-data'
import { getCategoryById } from '@/lib/kcs-taxonomy'
import { BorrowReserveConfirmModal } from './borrow-reserve-confirm-modal'
import { BookCard } from './book-card'

const formats = ['All', ...Object.values(mediaTypeLabels)]

/**
 * Public book browse grid — search + category + media-type filter over the
 * shared resources store. Seeds its initial search text from `?q=`, so the
 * header's global search bar (which just navigates to `/library?q=...`)
 * actually produces filtered results on arrival, not just a page reload.
 */
export function LibraryBrowser() {
  const { data: books, loading, error } = useResources()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [search, setSearch] = useState(initialQuery)
  const [category, setCategory] = useState('All')
  const [format, setFormat] = useState('All')
  const [showFilters, setShowFilters] = useState(!!initialQuery)
  const [pending, setPending] = useState<{ book: Resource; action: 'borrow' | 'reserve' } | null>(null)

  // Real category display names resolved from the canonical taxonomy, not a raw free-text field.
  const categories = ['All', ...Array.from(new Set(books.map((b) => getCategoryById(b.categoryId)?.name.en).filter((n): n is string => !!n)))]

  const filtered = books.filter((b) => {
    const q = search.toLowerCase()
    const categoryName = getCategoryById(b.categoryId)?.name.en
    return (
      b.status !== 'archived' &&
      (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) &&
      (category === 'All' || categoryName === category) &&
      (format === 'All' || mediaTypeLabels[b.mediaType] === format)
    )
  })

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5" aria-label="Loading books">
        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load the library" description={error} />
  }

  return (
    <>
      <div className="bg-transparent mb-8">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-700" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (e.target.value.length > 0) setShowFilters(true) }}
            onFocus={() => setShowFilters(true)}
            aria-label="Search by title or author"
            className="w-full pl-9 pr-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
          />
        </div>
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="relative flex-1">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by category"
                className="w-full px-4 py-2.5 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none appearance-none pr-8"
              >
                <option value="All">Category</option>
                {categories.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {category !== 'All' && (
                <button onClick={() => setCategory('All')} aria-label="Clear category filter" className="absolute right-2 top-1/2 -translate-y-1/2 text-w-600 hover:text-w-950 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="relative flex-1">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                aria-label="Filter by media type"
                className="w-full px-4 py-2.5 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none appearance-none pr-8"
              >
                <option value="All">Media Type</option>
                {formats.filter((f) => f !== 'All').map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              {format !== 'All' && (
                <button onClick={() => setFormat('All')} aria-label="Clear media type filter" className="absolute right-2 top-1/2 -translate-y-1/2 text-w-600 hover:text-w-950 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filtered.map((book) => <BookCard key={book.id} book={book} onAction={(b, action) => setPending({ book: b, action })} />)}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto text-w-400 mb-4" />
          <p className="font-lato text-w-700 mb-4">No resources match your search.</p>
          <ElegantButton variant="secondary" onClick={() => { setSearch(''); setCategory('All'); setFormat('All') }}>
            Clear Filters
          </ElegantButton>
        </div>
      )}

      <BorrowReserveConfirmModal
        action={pending?.action ?? null}
        bookTitle={pending?.book.title ?? ''}
        bookAuthor={pending?.book.author ?? ''}
        availableQty={pending?.book.availableQty}
        onClose={() => setPending(null)}
      />
    </>
  )
}
