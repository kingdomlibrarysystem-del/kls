'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, BookX, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { BuyConfirmModal, type BuyAction } from '@/app/(public)/library/_components/buy-confirm-modal'
import { useAuth } from '@/contexts/auth-context'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { useReadingProgress, startReading, markChapterRead, markBookComplete, getReadingProgressPercent } from '@/app/member/_shared/use-reading-progress'
import { useHighlights, addHighlight, getChapterHighlights } from '@/app/member/_shared/use-highlights'
import type { Highlight, HighlightColor } from '@/app/member/_shared/highlight-data'
import { HighlightPicker } from './highlight-picker'
import { useChapterSelection } from './use-chapter-selection'
import { NotesPanel } from './notes-panel'
import { ChapterSearch } from './chapter-search'
import { HighlightsNotesList } from './highlights-notes-list'
import { LockedChapterPaywall } from './locked-chapter-paywall'
import { ChapterNavFooter } from './chapter-nav-footer'
import { SkippedChaptersCard } from './skipped-chapters-card'
import { PdfReaderView } from './pdf-reader-view'
import { ReaderHeader } from './reader-header'
import { ChapterBody } from './chapter-body'

interface ReaderViewProps {
  resourceId: string
  initialChapterId?: string
}

/**
 * Chapter reader: one chapter's body at a time with prev/next nav, from
 * the shared useReadableContent() store. Falls back to PdfReaderView for
 * a documentUrl-only resource with no authored chapters. Progress
 * auto-starts/resumes and tracks every chapter actually viewed, resuming
 * at `lastChapterId` unless the URL names one explicitly.
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
  const [buyAction, setBuyAction] = useState<BuyAction>(null)

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

  // A resource with no authored Chapter rows but a real uploaded PDF gets
  // the page-native PDF reader instead of the plain-text chapter reader —
  // chapters stay the primary experience (real highlights/notes/paywall
  // gating) whenever they exist, so this only applies to PDF-only resources.
  if (resource && (!readable || chapters.length === 0) && resource.documentUrl) {
    return <PdfReaderView documentUrl={resource.documentUrl} bookTitle={resource.title} />
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
    ? chapters.filter((c) => !c.locked && !existingProgress?.completedChapterIds.includes(c.id) && c.id !== chapter.id)
    : []

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800, margin: '0 auto' }}>
      <Link href="/member/library" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>
        <ChevronLeft size={16} /> Back to Kingdom Library
      </Link>

      <ReaderHeader
        title={resource.title}
        chapterIndex={chapterIndex}
        totalChapters={chapters.length}
        progressPercent={existingProgress ? getReadingProgressPercent(existingProgress) : undefined}
      />

      <ChapterSearch chapters={chapters} onJump={goToChapter} />

      <div className="card" style={{ padding: 24 }}>
        <h2 className="cinzel" style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)', marginBottom: 14 }}>{chapter.title}</h2>
        {chapter.locked ? (
          <LockedChapterPaywall bookTitle={resource.title} priceRwf={resource.price} onBuyAction={setBuyAction} />
        ) : (
          <ChapterBody
            body={chapter.body ?? ''}
            bodyRef={bodyRef}
            highlights={chapterHighlights}
            onMouseUp={() => captureSelection(bodyRef.current)}
            onHighlightClick={setNoteHighlight}
          />
        )}
      </div>

      {noteHighlight ? (
        <NotesPanel resourceId={resourceId} chapterId={chapter.id} highlight={noteHighlight} onClose={() => setNoteHighlight(null)} />
      ) : (
        <NotesPanel resourceId={resourceId} chapterId={chapter.id} />
      )}

      <ChapterNavFooter
        chapterTitle={chapter.title}
        hasPrev={hasPrev}
        hasNext={hasNext}
        isLastChapter={isLastChapter}
        isCompleted={isCompleted}
        onPrev={() => goToChapter(Math.max(0, chapterIndex - 1))}
        onNext={() => goToChapter(Math.min(chapters.length - 1, chapterIndex + 1))}
        onMarkComplete={() => markBookComplete(resourceId, chapters.map((c) => c.id))}
      />

      {unreadChapters.length > 0 && (
        <SkippedChaptersCard
          progressPercent={existingProgress ? getReadingProgressPercent(existingProgress) : 0}
          chapters={unreadChapters}
          onJump={(id) => goToChapter(chapters.findIndex((x) => x.id === id))}
        />
      )}

      <HighlightsNotesList resourceId={resourceId} chapters={chapters} onJump={goToChapter} />

      {pending && (
        <HighlightPicker position={pending.position} onPick={handlePickColor} onClose={clearSelection} />
      )}

      <BuyConfirmModal action={buyAction} resourceId={resourceId} bookTitle={resource.title} priceRwf={resource.price} onClose={() => setBuyAction(null)} />
    </div>
  )
}
