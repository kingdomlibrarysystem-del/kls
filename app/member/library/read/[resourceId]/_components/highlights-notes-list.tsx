'use client'

import { useState } from 'react'
import { Highlighter, ChevronDown, ChevronUp, Trash2, StickyNote } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useHighlights, removeHighlight } from '@/app/member/_shared/use-highlights'
import { useNotes, removeNote } from '@/app/member/_shared/use-notes'
import { highlightColorTokens } from '@/app/member/_shared/highlight-data'
import type { Chapter } from '@/app/member/_shared/readable-content-data'

interface HighlightsNotesListProps {
  resourceId: string
  chapters: Chapter[]
  onJump: (chapterIndex: number) => void
}

/**
 * "My Highlights & Notes" — every highlight and note across the whole
 * book, not just the current chapter, so a member can review and jump
 * back to anything they've marked without paging through every chapter
 * manually. Collapsed by default since most chapters will have nothing
 * to show here initially.
 */
export function HighlightsNotesList({ resourceId, chapters, onJump }: HighlightsNotesListProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const allHighlights = useHighlights(user?.id).filter((h) => h.resourceId === resourceId)
  const allNotes = useNotes(user?.id).filter((n) => n.resourceId === resourceId)

  const chapterTitle = (chapterId: string) => chapters.find((c) => c.id === chapterId)?.title ?? chapterId
  const chapterIndex = (chapterId: string) => chapters.findIndex((c) => c.id === chapterId)

  if (allHighlights.length === 0 && allNotes.length === 0) return null

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <Highlighter size={15} color="var(--gold)" />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>My Highlights & Notes</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({allHighlights.length + allNotes.length})</span>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', display: 'flex' }}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          {allHighlights.map((h) => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 14px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: highlightColorTokens[h.color].background, border: `2px solid ${highlightColorTokens[h.color].border}`, flexShrink: 0, marginTop: 3 }} />
              <button onClick={() => onJump(chapterIndex(h.chapterId))} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>&ldquo;{h.text}&rdquo;</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{chapterTitle(h.chapterId)}</p>
              </button>
              <button onClick={() => removeHighlight(h.id)} aria-label="Delete highlight" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red-light)', flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {allNotes.map((n) => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 14px', borderBottom: '1px solid var(--border-light)' }}>
              <StickyNote size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
              <button onClick={() => onJump(chapterIndex(n.chapterId))} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.text}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{chapterTitle(n.chapterId)}{n.highlightId ? ' · on a highlight' : ''}</p>
              </button>
              <button onClick={() => removeNote(n.id)} aria-label="Delete note" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red-light)', flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
