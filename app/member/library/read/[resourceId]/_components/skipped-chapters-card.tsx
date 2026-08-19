'use client'

interface SkippedChaptersCardProps {
  progressPercent: number
  chapters: { id: string; title: string }[]
  onJump: (id: string) => void
}

/** Extracted from reader-view.tsx to keep it under the 200-line ceiling — the "chapters were skipped" card shown at the last chapter when earlier ones weren't read. */
export function SkippedChaptersCard({ progressPercent, chapters, onJump }: SkippedChaptersCardProps) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
        {progressPercent}% read — {chapters.length === 1 ? 'a chapter was' : `${chapters.length} chapters were`} skipped along the way. Read the remaining chapter{chapters.length === 1 ? '' : 's'}, or use Mark Complete above to finish anyway:
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {chapters.map((c) => (
          <button
            key={c.id}
            onClick={() => onJump(c.id)}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            {c.title}
          </button>
        ))}
      </div>
    </div>
  )
}
