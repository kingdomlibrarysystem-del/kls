'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronLeft as ChevronLeftNav, BookX, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { useReadingProgress, startReading, markChapterRead, markBookComplete, getReadingProgressPercent } from '@/app/member/_shared/use-reading-progress'
import { useHighlights, addHighlight, getChapterHighlights } from '@/app/member/_shared/use-highlights'
import type { Highlight, HighlightColor } from '@/app/member/_shared/highlight-data'
import { HighlightedParagraph } from './highlighted-paragraph'
import { HighlightPicker } from './highlight-picker'
import { useChapterSelection } from './use-chapter-selection'
import { NotesPanel } from './notes-panel'
import { ChapterSearch } from './chapter-search'
import { HighlightsNotesList } from './highlights-notes-list'

interface ReaderViewProps {
  resourceId: string
  initialChapterId?: string
}

/**
 * Basic chapter reader: renders one chapter's body text at a time with
 * prev/next navigation, resolving content from the shared
 * useReadableContent() store keyed by Resource ID. Not every Resource is
 * readable yet — only the 4 seeded in Phase 0 — so a missing entry is a
 * real, expected empty state, not a bug. Reading progress (Phase 2) is
 * tracked automatically: opening the reader starts/resumes progress, and
 * every chapter actually viewed is marked read — resuming at the last
 * chapter read (via `lastChapterId`) unless the URL explicitly names one
 * (e.g. Phase 3's "Continue Reading" links there directly).
 */
export function ReaderView({ resourceId, initialChapterId }: ReaderViewProps) {
  const { user } = useAuth()
  const { data: resources, loading, error } = useResources()
  const content = useReadableContent()
  const progressEntries = useReadingProgress(user?.id)

  const resource = resources.find((r) => r.id === resourceId)
  const readable = content[resourceId]
  const chapters = readable?.chapters ?? []
  const existingProgress = progressEntries.find((p) => p.resourceId === resourceId)
  const resumeChapterId = initialChapterId ?? existingProgress?.lastChapterId
  const startIndex = resumeChapterId ? Math.max(0, chapters.findIndex((c) => c.id === resumeChapterId)) : 0
  const [chapterIndex, setChapterIndex] = useState(startIndex)
  const initialized = useRef(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const highlightEntries = useHighlights(user?.id)
  const { pending, captureSelection, clearSelection } = useChapterSelection()
  const [noteHighlight, setNoteHighlight] = useState<Highlight | null>(null)

  useEffect(() => {
    if (initialized.current || chapters.length === 0) return
    initialized.current = true
    startReading(resourceId)
  }, [resourceId, chapters.length])

  useEffect(() => {
    if (chapters.length === 0) return
    const current = chapters[chapterIndex]
    if (current) markChapterRead(resourceId, current.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId, chapterIndex, chapters.length])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading reader">
        <Skeleton style={{ height: 40, borderRadius: 8 }} />
        <Skeleton style={{ height: 320, borderRadius: 8 }} />
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load this book" description={error} style={{ color: 'var(--text-secondary)' }} />
  }

  if (!resource || !readable || chapters.length === 0) {
    return (
      <EmptyState
        icon={BookX}
        title="Not available to read online yet"
        description="This resource doesn't have readable chapter content in the Kingdom Library yet."
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  const chapter = chapters[chapterIndex]
  const hasPrev = chapterIndex > 0
  const hasNext = chapterIndex < chapters.length - 1
  const isLastChapter = !hasNext
  const isCompleted = existingProgress?.status === 'COMPLETED'
  const unreadChapters = isLastChapter && !isCompleted
    ? chapters.filter((c) => !existingProgress?.completedChapterIds.includes(c.id) && c.id !== chapter.id)
    : []

  const paragraphs = chapter.body.split('\n\n')
  let runningOffset = 0
  const paragraphsWithOffsets = paragraphs.map((text) => {
    const paragraphStart = runningOffset
    runningOffset += text.length + 2 // account for the '\n\n' joiner stripped by split()
    return { text, paragraphStart }
  })
  const chapterHighlights = getChapterHighlights(resourceId, chapter.id)

  const goToChapter = (index: number) => {
    clearSelection()
    setNoteHighlight(null)
    setChapterIndex(index)
  }

  const handlePickColor = (color: HighlightColor) => {
    if (!pending) return
    addHighlight({ resourceId, chapterId: chapter.id, startOffset: pending.startOffset, endOffset: pending.endOffset, text: pending.text, color })
    clearSelection()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720, margin: '0 auto' }}>
      <Link href="/member/library" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
        <ChevronLeft size={14} /> Back to Kingdom Library
      </Link>

      <div>
        <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{resource.title}</h1>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Chapter {chapterIndex + 1} of {chapters.length}
          {existingProgress && ` — ${getReadingProgressPercent(existingProgress)}% complete`}
        </p>
        <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-section)', marginTop: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${existingProgress ? getReadingProgressPercent(existingProgress) : 0}%`, background: 'var(--gold)', transition: 'width 0.2s' }} />
        </div>
      </div>

      <ChapterSearch chapters={chapters} onJump={goToChapter} />

      <div className="card" style={{ padding: 24 }}>
        <h2 className="cinzel" style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', marginBottom: 14 }}>{chapter.title}</h2>
        <div
          ref={bodyRef}
          onMouseUp={() => captureSelection(bodyRef.current)}
          style={{ display: 'flex', flexDirection: 'column', gap: 14, userSelect: 'text' }}
        >
          {paragraphsWithOffsets.map(({ text, paragraphStart }, i) => (
            <HighlightedParagraph key={i} text={text} paragraphStart={paragraphStart} highlights={chapterHighlights} onHighlightClick={setNoteHighlight} />
          ))}
        </div>
      </div>

      {noteHighlight ? (
        <NotesPanel resourceId={resourceId} chapterId={chapter.id} highlight={noteHighlight} onClose={() => setNoteHighlight(null)} />
      ) : (
        <NotesPanel resourceId={resourceId} chapterId={chapter.id} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <button
          onClick={() => goToChapter(Math.max(0, chapterIndex - 1))}
          disabled={!hasPrev}
          className="btn btn-outline-dim btn-sm"
          style={{ opacity: hasPrev ? 1 : 0.4, cursor: hasPrev ? 'pointer' : 'not-allowed' }}
        >
          <ChevronLeftNav size={13} /> Previous
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{chapter.title}</span>
        {isLastChapter ? (
          isCompleted ? (
            <span
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
                background: 'var(--green-dim)', color: 'var(--green-light)', fontSize: 12, fontWeight: 600,
              }}
            >
              <CheckCircle2 size={14} /> Book Completed
            </span>
          ) : (
            <button
              onClick={() => markBookComplete(resourceId, chapters.map((c) => c.id))}
              className="btn btn-gold btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={13} /> Mark Complete
            </button>
          )
        ) : (
          <button
            onClick={() => goToChapter(Math.min(chapters.length - 1, chapterIndex + 1))}
            disabled={!hasNext}
            className="btn btn-gold btn-sm"
          >
            Next <ChevronRight size={13} />
          </button>
        )}
      </div>

      {unreadChapters.length > 0 && (
        <div className="card" style={{ padding: 14 }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {existingProgress ? getReadingProgressPercent(existingProgress) : 0}% read — {unreadChapters.length === 1 ? 'a chapter was' : `${unreadChapters.length} chapters were`} skipped along the way. Read the remaining chapter{unreadChapters.length === 1 ? '' : 's'}, or use Mark Complete above to finish anyway:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {unreadChapters.map((c) => (
              <button
                key={c.id}
                onClick={() => goToChapter(chapters.findIndex((x) => x.id === c.id))}
                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <HighlightsNotesList resourceId={resourceId} chapters={chapters} onJump={goToChapter} />

      {pending && (
        <HighlightPicker position={pending.position} onPick={handlePickColor} onClose={clearSelection} />
      )}
    </div>
  )
}
