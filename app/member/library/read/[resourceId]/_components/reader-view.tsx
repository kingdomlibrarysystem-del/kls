'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, BookX, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { BuyConfirmModal, type BuyAction } from '@/app/(public)/library/_components/buy-confirm-modal'
import { useAuth } from '@/contexts/auth-context'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { usePdfViewMode } from '@/app/member/_shared/use-pdf-view-mode'
import { useReadingProgress, startReading, markChapterRead, markBookComplete, getReadingProgressPercent } from '@/app/member/_shared/use-reading-progress'
import { NotesPanel } from './notes-panel'
import { ChapterSearch } from './chapter-search'
import { HighlightsNotesList } from './highlights-notes-list'
import { LockedChapterPaywall } from './locked-chapter-paywall'
import { ChapterNavFooter } from './chapter-nav-footer'
import { SkippedChaptersCard } from './skipped-chapters-card'
import { PdfReaderView } from './pdf-reader-view'
import { PdfViewModeToggle } from './pdf-view-mode-toggle'
import { ReaderHeader } from './reader-header'
import { ChapterBody } from './chapter-body'

interface ReaderViewProps {
  resourceId: string
  initialChapterId?: string
  /** Staff-only QA flag — forces the same paywall a non-entitled member would see, instead of the usual staff bypass, so an admin can verify what free-preview readers actually experience. */
  forcePreview?: boolean
  /** Where the "Back" link goes — /member/library by default, or /dashboard/library when this same reader is reached from the admin-side route (app/dashboard/library/read/[id]), so staff stay within dashboard navigation instead of being routed into the member portal. */
  backHref?: string
}

/**
 * Chapter reader: renders a TEXT book's authored chapters in the same three
 * view modes the PDF reader offers — a continuous scroll, a single chapter,
 * or a two-chapter facing-page spread — so reading a text book feels like
 * reading an uploaded PDF rather than a different, plainer UI. Falls back to
 * PdfReaderView for a documentUrl-only resource with no authored chapters.
 * Progress auto-starts/resumes and tracks every chapter actually visible,
 * resuming at `lastChapterId` unless the URL names one explicitly.
 *
 * Creating a NEW highlight by selecting body text is no longer offered —
 * ChapterBody now renders real markdown (headings/bold/quotes) via
 * MdPreview, which produces opaque HTML with no way to map a text
 * selection back to a chapter-relative character offset (the old
 * plain-text `[data-paragraph-start]` renderer this depended on is gone).
 * Reviewing/deleting a member's EXISTING highlights and adding chapter-
 * level notes both still work (HighlightsNotesList, NotesPanel) since
 * those only read already-stored data, not a live in-body selection.
 */
export function ReaderView({ resourceId, initialChapterId, forcePreview = false, backHref = '/member/library' }: ReaderViewProps) {
  const { user } = useAuth()
  const { data: resources, loading, error } = useResources()
  const content = useReadableContent()
  const progressEntries = useReadingProgress(user?.id)
  // Same hook/localStorage key the PDF reader uses, so one reading
  // preference follows the member across both kinds of book.
  const [viewMode, setViewMode] = usePdfViewMode()

  const resource = resources.find((r) => r.id === resourceId)
  const readable = content[resourceId]
  const chapters = readable?.chapters ?? []
  const existingProgress = progressEntries.find((p) => p.resourceId === resourceId)
  const resumeChapterId = initialChapterId ?? existingProgress?.lastChapterId
  const startIndex = resumeChapterId ? Math.max(0, chapters.findIndex((c) => c.id === resumeChapterId)) : 0
  const [chapterIndex, setChapterIndex] = useState(startIndex)
  const [buyAction, setBuyAction] = useState<BuyAction>(null)

  // Which chapters are on screen right now, by view mode. Scroll shows the
  // whole book at once; spread shows a facing-page pair and therefore steps
  // two at a time; single shows just the current one.
  const visibleIndexes =
    viewMode === 'scroll'
      ? chapters.map((_, i) => i)
      : viewMode === 'spread'
        ? [chapterIndex, chapterIndex + 1].filter((i) => i < chapters.length)
        : [chapterIndex]
  // Only the first locked chapter in view gets the full buy/borrow paywall —
  // a spread showing two locked chapters would otherwise stack two of them.
  const firstLockedVisible = visibleIndexes.find((i) => chapters[i]?.locked)

  useEffect(() => {
    if (chapters.length === 0) return
    startReading(resourceId)
  }, [resourceId, chapters.length])

  useEffect(() => {
    if (chapters.length === 0) return
    // Marks every chapter actually on screen, not just the anchor one, so
    // scrolling or reading a spread counts what the member can actually see.
    // Locked chapters are skipped — they render LockedChapterPaywall, not
    // real content, so landing on one must not count as having read it
    // (otherwise 0% of the book read could show as 100% progress).
    for (const i of visibleIndexes) {
      const c = chapters[i]
      if (c && !c.locked) markChapterRead(resourceId, c.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId, viewMode, chapterIndex, chapters.length])

  const backLink = (
    <Link href={backHref} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>
      <ChevronLeft size={16} /> {backHref === '/member/library' ? 'Back to Kingdom Library' : 'Back to Book Inventory'}
    </Link>
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading reader">
        {backLink}
        <Skeleton style={{ height: 40, borderRadius: 8 }} />
        <Skeleton style={{ height: 320, borderRadius: 8 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {backLink}
        <EmptyState icon={AlertTriangle} title="Couldn't load this book" description={error} style={{ color: 'var(--text-secondary)' }} />
      </div>
    )
  }

  // A resource with no authored Chapter rows but a real uploaded PDF gets
  // the page-native PDF reader instead of the plain-text chapter reader —
  // chapters stay the primary experience (real highlights/notes/paywall
  // gating) whenever they exist, so this only applies to PDF-only resources.
  if (resource && (!readable || chapters.length === 0) && resource.documentUrl) {
    return <PdfReaderView resourceId={resourceId} bookTitle={resource.title} priceRwf={resource.price} forcePreview={forcePreview} backHref={backHref} />
  }

  if (!resource || !readable || chapters.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {backLink}
        <EmptyState
          icon={BookX}
          title="Not available to read online yet"
          description="This resource doesn't have readable chapter content in the Kingdom Library yet."
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>
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

  const goToChapter = (index: number) => {
    const target = Math.max(0, Math.min(chapters.length - 1, index))
    // In scroll mode every chapter is already mounted, so switching to
    // single/spread anchors on the chosen one; scrolling to it works in
    // every mode because each chapter card carries a stable id.
    setChapterIndex(target)
    requestAnimationFrame(() => {
      document.getElementById(`reader-chapter-${chapters[target]?.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const renderChapter = (index: number) => {
    const c = chapters[index]
    if (!c) return null
    return (
      <div
        key={c.id}
        id={`reader-chapter-${c.id}`}
        style={{ padding: '28px 0', scrollMarginTop: 16, borderBottom: '1px solid var(--border)' }}
      >

        <h2 className="cinzel" style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)', marginBottom: 18 }}>{c.title}</h2>
        {c.locked ? (
          index === firstLockedVisible ? (
            <LockedChapterPaywall bookTitle={resource.title} priceRwf={resource.price} onBuyAction={setBuyAction} />
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              This chapter is locked. Use the paywall alongside to buy or borrow the book.
            </p>
          )
        ) : (
          <ChapterBody body={c.body ?? ''} />
        )}
        <NotesPanel resourceId={resourceId} chapterId={c.id} />
      </div>
    )
  }

  const isSpread = viewMode === 'spread'
  const isScroll = viewMode === 'scroll'
  // A spread needs room for two columns; single/scroll stay a readable
  // measure, matching the PDF reader's own 1400px spread width.
  const shellWidth = isSpread ? 1400 : 800

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: shellWidth, margin: '0 auto' }}>
      {backLink}

      <ReaderHeader
        title={resource.title}
        chapterIndex={chapterIndex}
        totalChapters={chapters.length}
        progressPercent={existingProgress ? getReadingProgressPercent(existingProgress) : undefined}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {isScroll
            ? `All ${chapters.length} chapter${chapters.length === 1 ? '' : 's'}`
            : `Chapter ${chapterIndex + 1} of ${chapters.length}${isSpread && visibleIndexes.length === 1 ? ' (last spread)' : ''}`}
        </p>
        <PdfViewModeToggle mode={viewMode} onChange={setViewMode} />
      </div>

      <ChapterSearch chapters={chapters} onJump={goToChapter} />

      {isScroll ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {visibleIndexes.map(renderChapter)}
        </div>
      ) : isSpread ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 340px', minWidth: 0 }}>{renderChapter(visibleIndexes[0])}</div>
          {visibleIndexes.length > 1 && (
            <div style={{ flex: '1 1 340px', minWidth: 0 }}>{renderChapter(visibleIndexes[1])}</div>
          )}
        </div>
      ) : (
        renderChapter(chapterIndex)
      )}

      {!isScroll && (
        <ChapterNavFooter
          chapterTitle={chapter.title}
          hasPrev={hasPrev}
          hasNext={hasNext}
          isLastChapter={isLastChapter}
          isCompleted={isCompleted}
          onPrev={() => goToChapter(chapterIndex - (isSpread ? 2 : 1))}
          onNext={() => goToChapter(chapterIndex + (isSpread ? 2 : 1))}
          onMarkComplete={() => markBookComplete(resourceId, chapters.map((c) => c.id))}
        />
      )}

      {unreadChapters.length > 0 && (
        <SkippedChaptersCard
          progressPercent={existingProgress ? getReadingProgressPercent(existingProgress) : 0}
          chapters={unreadChapters}
          onJump={(id) => goToChapter(chapters.findIndex((x) => x.id === id))}
        />
      )}

      <HighlightsNotesList resourceId={resourceId} chapters={chapters} onJump={goToChapter} />

      <BuyConfirmModal action={buyAction} resourceId={resourceId} bookTitle={resource.title} priceRwf={resource.price} onClose={() => setBuyAction(null)} />
    </div>
  )
}
