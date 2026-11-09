'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, BookOpen, Search } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useFolderBooks } from '@/app/dashboard/life-sciences/_components/use-life-sciences'
import { MemberBookCard } from './member-book-card'

/** Flat, searchable list of every active Life Sciences book. */
export function MemberBooksView({ basePath = '/member/life-sciences' }: { basePath?: string } = {}) {
  const { data, loading, error } = useFolderBooks()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q) ||
        (book.folderName ?? '').toLowerCase().includes(q),
    )
  }, [data, search])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="cinzel" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          All Life Sciences Books
        </h1>
        <p style={{ marginTop: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
          Every free PDF and PowerPoint book, across all folders.
        </p>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 420 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search books…"
          aria-label="Search books"
          style={{
            width: '100%',
            padding: '10px 12px 10px 36px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 200, borderRadius: 10, background: 'var(--bg-section)' }} />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title="Couldn't load books" description={error} style={{ color: 'var(--text-secondary)' }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={data.length === 0 ? 'No books yet' : 'No books match your search'}
          description={data.length === 0 ? 'Check back soon — new books are added regularly.' : 'Try a different search term.'}
          style={{ color: 'var(--text-secondary)' }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {filtered.map((book) => <MemberBookCard key={book.id} book={book} basePath={basePath} />)}
        </div>
      )}
    </div>
  )
}
