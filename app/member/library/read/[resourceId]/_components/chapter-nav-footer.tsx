'use client'

import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

interface ChapterNavFooterProps {
  chapterTitle: string
  hasPrev: boolean
  hasNext: boolean
  isLastChapter: boolean
  isCompleted: boolean
  onPrev: () => void
  onNext: () => void
  onMarkComplete: () => void
}

/** Extracted from reader-view.tsx to keep it under the 200-line ceiling — the Previous/Next/Mark Complete row below a chapter's body. */
export function ChapterNavFooter({ chapterTitle, hasPrev, hasNext, isLastChapter, isCompleted, onPrev, onNext, onMarkComplete }: ChapterNavFooterProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className="btn btn-outline-dim btn-sm"
        style={{ opacity: hasPrev ? 1 : 0.4, cursor: hasPrev ? 'pointer' : 'not-allowed' }}
      >
        <ChevronLeft size={15} /> Previous
      </button>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{chapterTitle}</span>
      {isLastChapter ? (
        isCompleted ? (
          <span
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: 'var(--green-dim)', color: 'var(--green-light)', fontSize: 14, fontWeight: 600,
            }}
          >
            <CheckCircle2 size={16} /> Book Completed
          </span>
        ) : (
          <button onClick={onMarkComplete} className="btn btn-gold btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15} /> Mark Complete
          </button>
        )
      ) : (
        <button onClick={onNext} disabled={!hasNext} className="btn btn-gold btn-sm">
          Next <ChevronRight size={15} />
        </button>
      )}
    </div>
  )
}
