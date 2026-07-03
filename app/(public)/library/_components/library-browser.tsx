'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, BookOpen, ChevronDown, ChevronUp, X } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { BorrowReserveConfirmModal } from './borrow-reserve-confirm-modal'

interface Book {
  id: string
  title: string
  author: string
  category: string
  format: string
  summary: string
  isbn: string
  pages: number
  language: string
  year: number
  price: number
  cover: string
}

const categories = ['All', 'Philosophy', 'Technology', 'History', 'Arts']
const formats = ['All', 'E-Book', 'PDF Journal', 'Interactive PDF']

function BookCard({ book, onAction }: { book: Book; onAction: (book: Book, action: 'borrow' | 'reserve') => void }) {
  const [showSummary, setShowSummary] = useState(false)
  const { isAuthenticated } = useAuth()

  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <div className="relative w-full h-52 bg-w-200">
        <Image src={book.cover} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-cinzel text-sm font-semibold text-w-950 leading-snug mb-1">{book.title}</h3>
          <p className="font-lato text-xs text-w-700">by {book.author}</p>
        </div>
        <p className="font-cinzel text-base font-bold text-w-600">{book.price.toLocaleString('en-RW')} RWF</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato">{book.category}</span>
          <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato">{book.format}</span>
          <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato">{book.year}</span>
        </div>
        <div className="flex gap-3 text-xs font-lato text-w-700">
          <span>{book.pages} pages</span><span>·</span>
          <span>{book.language}</span><span>·</span>
          <span>ISBN {book.isbn}</span>
        </div>
        <button
          onClick={() => setShowSummary((v) => !v)}
          className="flex items-center gap-1 font-lato text-xs text-w-600 hover:text-w-950 transition-colors w-fit"
        >
          {showSummary ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showSummary ? 'Hide summary' : 'View summary'}
        </button>
        {showSummary && (
          <p className="font-lato text-xs text-w-700 leading-relaxed border-t border-w-300 pt-2">{book.summary}</p>
        )}
        <div className="flex gap-2 mt-auto pt-3">
          {isAuthenticated ? (
            <>
              <ElegantButton variant="primary" className="flex-1 text-xs py-2" onClick={() => onAction(book, 'borrow')}>Borrow</ElegantButton>
              <ElegantButton variant="outline" className="flex-1 text-xs py-2" onClick={() => onAction(book, 'reserve')}>Reserve</ElegantButton>
            </>
          ) : (
            <>
              <Link href={`/auth/login?redirect=${encodeURIComponent('/library')}`} className="flex-1">
                <ElegantButton variant="primary" className="w-full text-xs py-2">Borrow</ElegantButton>
              </Link>
              <Link href={`/auth/login?redirect=${encodeURIComponent('/library')}`} className="flex-1">
                <ElegantButton variant="outline" className="w-full text-xs py-2">Reserve</ElegantButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function LibraryBrowser({ books }: { books: Book[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [format, setFormat] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [pending, setPending] = useState<{ book: Book; action: 'borrow' | 'reserve' } | null>(null)

  const filtered = books.filter((b) => {
    const q = search.toLowerCase()
    return (
      (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) &&
      (category === 'All' || b.category === category) &&
      (format === 'All' || b.format === format)
    )
  })

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
            className="w-full pl-9 pr-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
          />
        </div>
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="relative flex-1">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none appearance-none pr-8"
              >
                <option value="All">Category</option>
                {categories.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {category !== 'All' && (
                <button onClick={() => setCategory('All')} className="absolute right-2 top-1/2 -translate-y-1/2 text-w-600 hover:text-w-950 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="relative flex-1">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-4 py-2.5 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none appearance-none pr-8"
              >
                <option value="All">Format</option>
                {formats.filter((f) => f !== 'All').map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              {format !== 'All' && (
                <button onClick={() => setFormat('All')} className="absolute right-2 top-1/2 -translate-y-1/2 text-w-600 hover:text-w-950 transition-colors">
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
        onClose={() => setPending(null)}
      />
    </>
  )
}
