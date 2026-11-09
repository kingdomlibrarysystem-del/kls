'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, BookOpen, ChevronLeft, Search } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useBookFolders, useFolderBooks } from '@/app/dashboard/life-sciences/_components/use-life-sciences'
import { MemberBookCard } from './member-book-card'

/** Reader-facing list of books inside one folder. */
export function MemberFolderView({
  folderId,
  basePath = '/member/life-sciences',
}: {
  folderId: string
  basePath?: string
}) {
  const folders = useBookFolders()
  const books = useFolderBooks({ folderId })
  const [search, setSearch] = useState('')

  const folder = folders.data.find((f) => f.id === folderId)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return books.data
    return books.data.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q),
    )
  }, [books.data, search])

  const loading = folders.loading || books.loading
  const error = folders.error ?? books.error

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <Link
        href={basePath}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 14 }}
      >
        <ChevronLeft size={15} /> Back to folders
      </Link>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 200, borderRadius: 10, background: 'var(--bg-section)' }} />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title="Couldn't load this folder" description={error} style={{ color: 'var(--text-secondary)' }} />
      ) : !folder ? (
        <EmptyState
          icon={AlertTriangle}
          title="Folder not found"
          description="This folder may have been removed."
          style={{ color: 'var(--text-secondary)' }}
        />
      ) : (
        <>
          <div style={{ marginBottom: 18 }}>
            <h1 className="cinzel" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {folder.name}
            </h1>
            <p style={{ marginTop: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
              {folder.description || 'Browse the books in this folder.'}
            </p>
            <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
              {folder.bookCount} book{folder.bookCount === 1 ? '' : 's'}
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

          {filtered.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={books.data.length === 0 ? 'No books in this folder yet' : 'No books match your search'}
              description={books.data.length === 0 ? 'Check back soon — new books are added regularly.' : 'Try a different search term.'}
              style={{ color: 'var(--text-secondary)' }}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {filtered.map((book) => <MemberBookCard key={book.id} book={book} basePath={basePath} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
