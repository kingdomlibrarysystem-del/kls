'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronLeft, Download, ExternalLink, Presentation } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { isPresentation, type FolderBook } from '@/lib/data/book-folders'
import { BookPdfReader } from './book-pdf-reader'

/** Reader page: PDFs render inline, PowerPoint decks embed via Office viewer. */
export function MemberBookReader({
  bookId,
  basePath = '/member/life-sciences',
}: {
  bookId: string
  basePath?: string
}) {
  const [result, setResult] = useState<{ key: string; book: FolderBook | null; error: string | null }>({
    key: '',
    book: null,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    fetch(`/api/folder-books/${bookId}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not load this book')
        return json.data as FolderBook
      })
      .then((book) => { if (!cancelled) setResult({ key: bookId, book, error: null }) })
      .catch((err) => {
        if (!cancelled) setResult({ key: bookId, book: null, error: err instanceof Error ? err.message : 'Could not load this book' })
      })
    return () => { cancelled = true }
  }, [bookId])

  const book = result.book
  const error = result.error
  const loading = result.key !== bookId
  const backHref = book?.folderId ? `${basePath}/${book.folderId}` : `${basePath}/books`
  const backLabel = book?.folderName ? `Back to ${book.folderName}` : 'Back to books'

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ height: 640, borderRadius: 8, background: 'var(--bg-section)' }} />
      </div>
    )
  }

  if (error || !book) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load this book"
        description={error ?? 'This book may have been removed.'}
        style={{ color: 'var(--text-secondary)' }}
        action={
          <Link href={basePath} className="btn btn-gold btn-sm" style={{ textDecoration: 'none' }}>
            Browse Life Sciences
          </Link>
        }
      />
    )
  }

  const documentUrl = `/api/folder-books/${book.id}/document`
  const downloadUrl = `${documentUrl}?download=1`
  const presentation = isPresentation(book)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <Link
        href={backHref}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 14 }}
      >
        <ChevronLeft size={15} /> {backLabel}
      </Link>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="cinzel" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {book.title}
          </h1>
          <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
            by {book.author}{book.folderName ? ` · ${book.folderName}` : ''}
          </p>
          <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', maxWidth: 700, lineHeight: 1.5 }}>
            {book.description}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a
            href={downloadUrl}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <Download size={14} /> Download
          </a>
          <a
            href={book.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <ExternalLink size={14} /> Open original
          </a>
        </div>
      </div>

      {presentation ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <Presentation size={14} /> PowerPoint preview (via Office Online)
          </div>
          <div style={{ position: 'relative', width: '100%', paddingTop: '62%', background: 'var(--bg-section)', borderRadius: 8, overflow: 'hidden' }}>
            <iframe
              title={`${book.title} presentation`}
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(book.documentUrl)}`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            If the preview doesn&apos;t load, use <strong>Download</strong> or <strong>Open original</strong> above.
          </p>
        </div>
      ) : (
        <BookPdfReader file={documentUrl} title={book.title} />
      )}
    </div>
  )
}
