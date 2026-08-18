'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Chapter } from '@/app/member/_shared/readable-content-data'

interface ChapterSearchProps {
  chapters: Chapter[]
  onJump: (chapterIndex: number) => void
}

/** One search match: which chapter, and a short snippet of surrounding text. */
interface SearchMatch {
  chapterIndex: number
  chapterTitle: string
  snippet: string
}

const SNIPPET_RADIUS = 40

function buildSnippet(body: string, query: string): string {
  const index = body.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return ''
  const start = Math.max(0, index - SNIPPET_RADIUS)
  const end = Math.min(body.length, index + query.length + SNIPPET_RADIUS)
  return `${start > 0 ? '…' : ''}${body.slice(start, end)}${end < body.length ? '…' : ''}`
}

/** Search-within-book: a simple query box that finds every chapter containing the search term and jumps the reader there on click. */
export function ChapterSearch({ chapters, onJump }: ChapterSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const matches: SearchMatch[] = query.trim().length < 2 ? [] : chapters
    .map((chapter, chapterIndex) => ({ chapter, chapterIndex }))
    .filter(({ chapter }) => !chapter.locked && (chapter.body?.toLowerCase().includes(query.toLowerCase()) || chapter.title.toLowerCase().includes(query.toLowerCase())))
    .map(({ chapter, chapterIndex }) => ({
      chapterIndex,
      chapterTitle: chapter.title,
      snippet: (chapter.body && buildSnippet(chapter.body, query)) || chapter.title,
    }))

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search within this book..."
          aria-label="Search within this book"
          style={{ width: '100%', padding: '7px 30px 7px 30px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            aria-label="Clear search"
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          {matches.length === 0 ? (
            <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>No matches in this book.</div>
          ) : (
            matches.map((match) => (
              <button
                key={match.chapterIndex}
                onClick={() => { onJump(match.chapterIndex); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)' }}>{match.chapterTitle}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{match.snippet}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
