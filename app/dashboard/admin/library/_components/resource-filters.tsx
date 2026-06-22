'use client'

import { Search, X } from 'lucide-react'

export interface Filters {
  search: string
  category: string
  type: string
  format: string
  language: string
}

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  totalResults: number
}

const categories = ['All', 'Science', 'Technology', 'History', 'Literature', 'Arts', 'Philosophy', 'Medicine', 'Law', 'Business']
const types      = ['All', 'Book', 'E-Book', 'Journal', 'Magazine', 'Audio', 'Video']
const formats    = ['All', 'Physical', 'Digital']
const languages  = ['All', 'EN', 'FR', 'RW']

const selectCls = 'px-3 py-2.5 font-lato text-sm border border-w-400 bg-form-bg rounded focus:border-w-600 focus:outline-none text-w-950'

export function ResourceFilters({ filters, onChange, totalResults }: Props) {
  const set = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value })

  const hasActiveFilters =
    filters.search || filters.category !== 'All' || filters.type !== 'All' ||
    filters.format !== 'All' || filters.language !== 'All'

  const reset = () => onChange({ search: '', category: 'All', type: 'All', format: 'All', language: 'All' })

  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg p-5 mb-6">
      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-600" />
        <input
          type="text"
          placeholder="Search by title, author, or ISBN..."
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 font-lato text-sm border border-w-400 bg-form-bg rounded focus:border-w-600 focus:outline-none"
        />
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <select value={filters.category} onChange={(e) => set('category', e.target.value)} className={selectCls}>
          {categories.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => set('type', e.target.value)} className={selectCls}>
          {types.map((t) => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
        <select value={filters.format} onChange={(e) => set('format', e.target.value)} className={selectCls}>
          {formats.map((f) => <option key={f} value={f}>{f === 'All' ? 'All Formats' : f}</option>)}
        </select>
        <select value={filters.language} onChange={(e) => set('language', e.target.value)} className={selectCls}>
          {languages.map((l) => <option key={l} value={l}>{l === 'All' ? 'All Languages' : l}</option>)}
        </select>
      </div>

      {/* Results + clear */}
      <div className="flex items-center justify-between mt-3">
        <p className="font-lato text-xs text-w-700">
          {totalResults} resource{totalResults !== 1 ? 's' : ''} found
        </p>
        {hasActiveFilters && (
          <button onClick={reset} className="flex items-center gap-1 font-lato text-xs text-w-600 hover:text-w-950 transition-colors">
            <X size={12} /> Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
