'use client'

import Link from 'next/link'
import { BookOpen, FileText, Presentation } from 'lucide-react'
import { isPresentation, type FolderBook } from '@/lib/data/book-folders'

/** Compact reader-facing card for one document-only book. */
export function MemberBookCard({ book, basePath = '/member/life-sciences' }: { book: FolderBook; basePath?: string }) {
  const presentation = isPresentation(book)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.16)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 38,
            height: 38,
            minWidth: 38,
            borderRadius: 8,
            background: 'rgba(212,168,67,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold)',
          }}
        >
          {presentation ? <Presentation size={18} /> : <FileText size={18} />}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {book.documentType}
        </span>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>{book.title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>by {book.author}</div>
      {book.folderName && <div style={{ fontSize: 11, color: 'var(--gold)' }}>{book.folderName}</div>}

      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          flex: 1,
        }}
      >
        {book.description}
      </p>

      <Link
        href={`${basePath}/books/${book.id}`}
        className="btn btn-gold btn-sm"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', marginTop: 4 }}
      >
        <BookOpen size={14} /> Read
      </Link>
    </div>
  )
}
