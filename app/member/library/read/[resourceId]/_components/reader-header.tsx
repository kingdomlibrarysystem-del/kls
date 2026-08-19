'use client'

interface ReaderHeaderProps {
  title: string
  chapterIndex: number
  totalChapters: number
  progressPercent?: number
}

/** Extracted from reader-view.tsx to keep it under the 200-line ceiling — the book title + chapter-count + progress-bar header. */
export function ReaderHeader({ title, chapterIndex, totalChapters, progressPercent }: ReaderHeaderProps) {
  return (
    <div>
      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h1>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
        Chapter {chapterIndex + 1} of {totalChapters}
        {progressPercent !== undefined && ` — ${progressPercent}% complete`}
      </p>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-section)', marginTop: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progressPercent ?? 0}%`, background: 'var(--gold)', transition: 'width 0.2s' }} />
      </div>
    </div>
  )
}
