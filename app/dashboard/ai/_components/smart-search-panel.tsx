'use client'

import { useState } from 'react'
import { Search, AlertCircle, BookOpen, FileText, FlaskConical } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { cannedSearchResults, type SearchResult } from './ai-mock-data'

const typeIcon: Record<SearchResult['type'], React.ReactNode> = {
  Resource: <BookOpen size={14} />,
  Publication: <FileText size={14} />,
  'Research Paper': <FlaskConical size={14} />,
}

/**
 * Mocked semantic search: returns the same canned result set for any
 * non-empty query, simulating a search without a live backend.
 */
export function SmartSearchPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [error, setError] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (!query.trim()) throw new Error('Enter a search term first')
      setResults(cannedSearchResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults(null)
    }
  }

  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg p-5">
      <h2 className="font-cinzel text-sm font-semibold text-w-950 mb-3">Smart Search</h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources, publications, research papers..."
            aria-label="Semantic search query"
            className="w-full pl-8 pr-4 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-w-600 text-white rounded font-lato text-sm font-semibold hover:bg-w-700 transition-colors">
          Search
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 font-lato text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <p className="font-lato text-xs text-w-500 mb-4 italic">
        AI summaries and search results may not be fully accurate — always verify against the original source.
      </p>

      {results === null ? (
        <EmptyState icon={Search} title="No search run yet" description="Enter a term above to see mocked semantic search results." />
      ) : results.length === 0 ? (
        <EmptyState icon={Search} title="No results found" description="Try a different search term." />
      ) : (
        <ul className="space-y-2" aria-label="Search results">
          {results.map((r) => (
            <li key={r.id} className="flex items-start gap-2 bg-white border border-w-300 rounded-lg p-3">
              <span className="text-w-600 mt-0.5">{typeIcon[r.type]}</span>
              <div>
                <p className="font-lato text-sm font-semibold text-w-950">{r.title}</p>
                <p className="font-lato text-xs text-w-600 mb-1">{r.type}</p>
                <p className="font-lato text-xs text-w-700 leading-relaxed">{r.snippet}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
