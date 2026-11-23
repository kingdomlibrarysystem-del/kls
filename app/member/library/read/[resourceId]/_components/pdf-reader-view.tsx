'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, AlertTriangle, Download, Lock, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { usePdfViewMode } from '@/app/member/_shared/use-pdf-view-mode'
import { BuyConfirmModal, type BuyAction } from '@/app/(public)/library/_components/buy-confirm-modal'
import { LazyPdfPage, PdfPageSkeleton, PDF_OPTIONS, useArrowKeys } from '@/components/reader/lazy-pdf'
import { scrollToFirstPdfHit, usePdfSearchHighlighter } from '@/components/reader/search-highlight'
import { PdfViewModeToggle } from './pdf-view-mode-toggle'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// A CDN-hosted worker (the docs' usual recommendation) fails in this
// app with "Setting up fake worker failed: Failed to fetch dynamically
// imported module" — pdf.js v5's worker is itself an ES module loaded
// via a cross-origin dynamic import, which browsers/CSP can refuse.
// Bundling the exact matching worker file as a same-origin static
// asset via new URL(..., import.meta.url) (Next.js/Turbopack resolves
// this at build time) sidesteps both the CDN dependency and the
// cross-origin import entirely.
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

/** Widest a page is drawn; on narrower screens it shrinks to fit (see `pageWidth`). */
const MAX_PAGE_WIDTH = 900
/** The card around each page has 8px padding on each side. */
const CARD_PADDING = 16
/** A4 height ÷ width, until the real first page tells us its shape. */
const DEFAULT_RATIO = 1.414

interface PdfReaderViewProps {
  resourceId: string
  bookTitle: string
  priceRwf: number
  /** Staff-only QA flag — forces the same paywall a non-entitled member would see. */
  forcePreview?: boolean
  /** Where the "Back" link goes — see ReaderView's own backHref docstring. */
  backHref?: string
  /** Open at this page (1-based), e.g. from a search result. */
  initialPage?: number
  /** Words from a site search (?q=…) to highlight on the pages. */
  highlight?: string
}

interface Entitlement {
  entitled: boolean
  freePreviewPages: number
  canDownload: boolean
}

/**
 * Real page-native reader for a resource's uploaded PDF. The browser never
 * receives bytes past the free preview — GET /api/resources/[id]/document
 * returns a truncated PDF for a non-entitled viewer and the full file
 * (streamed, with Range support) once they have access. Download is offered
 * only after a real PAID SALE order.
 *
 * Speed: the document starts loading at once (in parallel with the access
 * check, which only decides the Download button and the paywall card), the
 * loading shows its percentage, and the scroll view draws only the pages near
 * the screen (LazyPdfPage). Scroll is the default view; in single / two-page
 * view the ← → keys turn the page.
 */
export function PdfReaderView({ resourceId, bookTitle, priceRwf, forcePreview = false, backHref = '/member/library', initialPage, highlight }: PdfReaderViewProps) {
  // Opened from a site search: the searched words are marked on every page.
  const textRenderer = usePdfSearchHighlighter(highlight)
  const [mode, setMode] = usePdfViewMode()
  const [numPages, setNumPages] = useState<number | null>(null)
  const [ratio, setRatio] = useState(DEFAULT_RATIO)
  const [pageIndex, setPageIndex] = useState(0)
  const [loadPercent, setLoadPercent] = useState<number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null)
  const [buyAction, setBuyAction] = useState<BuyAction>(null)
  /** Bumped after buying, so the full book is fetched instead of the (cached) preview. */
  const [docRev, setDocRev] = useState(0)
  const previewQuery = forcePreview ? '?preview=1' : ''
  // The reader's own width, measured in the browser. A PDF page is drawn at
  // an exact pixel width, so it must be told how much room there is: a fixed
  // 900px page ran off both edges of a phone screen.
  const [shell, setShell] = useState<HTMLDivElement | null>(null)
  const [shellWidth, setShellWidth] = useState(0)
  useEffect(() => {
    if (!shell) return
    const measure = () => setShellWidth(shell.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(shell)
    return () => observer.disconnect()
  }, [shell])
  const available = shellWidth > 0 ? shellWidth - CARD_PADDING : MAX_PAGE_WIDTH
  const pageWidth = Math.max(200, Math.min(MAX_PAGE_WIDTH, available))
  // Two facing pages only when both fit side by side; otherwise each takes the full width and they stack.
  const spreadPageWidth = available >= 640 ? Math.min(MAX_PAGE_WIDTH / 2 - 8, Math.floor((shellWidth - 12) / 2) - CARD_PADDING) : pageWidth

  /** `wasEntitled` = access before a purchase; gaining access reloads the full book instead of the preview. */
  const loadEntitlement = useCallback((wasEntitled?: boolean) => {
    fetch(`/api/resources/${resourceId}/entitlement${previewQuery}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 'success') return
        setEntitlement(json.data)
        if (wasEntitled === false && json.data.entitled) { setNumPages(null); setDocRev((r) => r + 1) }
      })
      .catch(() => setEntitlement({ entitled: false, freePreviewPages: 0, canDownload: false }))
  }, [resourceId, previewQuery])
  useEffect(() => { loadEntitlement() }, [loadEntitlement])

  const step = mode === 'spread' ? 2 : 1
  const goToPage = (index: number) => {
    if (numPages) setPageIndex(Math.max(0, Math.min(numPages - 1, index)))
  }
  useArrowKeys(mode !== 'scroll' && !!numPages, () => goToPage(pageIndex - step), () => goToPage(pageIndex + step))
  // Scroll view: the page in the middle of the screen is the current page.
  const onPageVisible = useCallback((n: number) => setPageIndex(n - 1), [])


  const backLink = (
    <Link href={backHref} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>
      <ChevronLeft size={16} /> {backHref === '/member/library' ? 'Back to Kingdom Library' : 'Back to Book Inventory'}
    </Link>
  )

  if (loadError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {backLink}
        <EmptyState icon={AlertTriangle} title="Couldn't load this PDF" description={loadError} style={{ color: 'var(--text-secondary)' }} />
      </div>
    )
  }

  const documentUrl = `/api/resources/${resourceId}/document${previewQuery}${docRev ? `${previewQuery ? '&' : '?'}r=${docRev}` : ''}`
  const previewOnly = entitlement !== null && !entitlement.entitled
  const singleHeight = Math.round(pageWidth * ratio)
  const spreadHeight = Math.round(spreadPageWidth * ratio)

  return (
    <div ref={setShell} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1400, margin: '0 auto', width: '100%', minWidth: 0 }}>
      {backLink}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {numPages ? `Page ${pageIndex + 1} of ${numPages}${previewOnly ? ' (preview)' : ''}` : 'Opening the book…'}
          {numPages && mode !== 'scroll' && <span className="hidden sm:inline"> · use ← → keys to turn pages</span>}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {entitlement?.canDownload && (
            <a href={`/api/resources/${resourceId}/download`} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Download size={13} /> Download
            </a>
          )}
          <PdfViewModeToggle mode={mode} onChange={setMode} />
        </div>
      </div>

      <Document
        file={documentUrl}
        options={PDF_OPTIONS}
        onLoadProgress={({ loaded, total }) => { if (total) setLoadPercent(Math.min(99, Math.round((loaded / total) * 100))) }}
        onLoadSuccess={(pdf) => {
          setNumPages(pdf.numPages)
          // Size every placeholder like the real pages, so scrolling does not jump.
          pdf.getPage(1).then((p) => { const v = p.getViewport({ scale: 1 }); if (v.width) setRatio(v.height / v.width) }).catch(() => {})
            .finally(() => {
              // Opened at a page (?page=12, e.g. from search): go there once the pages have their real size.
              if (!initialPage || initialPage < 2) return
              const n = Math.min(initialPage, pdf.numPages)
              setPageIndex(n - 1)
              requestAnimationFrame(() => requestAnimationFrame(() => {
                document.getElementById(`pdf-page-${n}`)?.scrollIntoView({ block: 'start' })
                // Then bring the first searched word on that page to the middle of the screen.
                if (highlight) scrollToFirstPdfHit(n)
              }))
            })
        }}
        onLoadError={(err) => setLoadError(err.message ?? 'The document failed to load.')}
        loading={
          <div className="card flex flex-col items-center justify-center gap-3" style={{ minHeight: 420 }} role="status">
            <Loader2 className="size-9 animate-spin text-primary" />
            <p className="text-sm font-semibold text-foreground">Opening “{bookTitle}”…</p>
            {loadPercent !== null && (
              <div className="h-1.5 w-56 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${loadPercent}%` }} />
              </div>
            )}
          </div>
        }
      >
        {mode === 'scroll' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            {Array.from({ length: numPages ?? 0 }, (_, i) => (
              <LazyPdfPage key={i} pageNumber={i + 1} width={pageWidth} ratio={ratio} onVisible={onPageVisible} label={bookTitle} textRenderer={textRenderer} />
            ))}
          </div>
        )}

        {mode === 'single' && numPages && (
          <div className="card" style={{ padding: 8, display: 'flex', justifyContent: 'center' }}>
            <Page pageNumber={pageIndex + 1} width={pageWidth} renderAnnotationLayer={false} customTextRenderer={textRenderer} loading={<PdfPageSkeleton width={pageWidth} height={singleHeight} label={`Page ${pageIndex + 1}`} />} />
          </div>
        )}

        {mode === 'spread' && numPages && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: 8 }}>
              <Page pageNumber={pageIndex + 1} width={spreadPageWidth} renderAnnotationLayer={false} customTextRenderer={textRenderer} loading={<PdfPageSkeleton width={spreadPageWidth} height={spreadHeight} label={`Page ${pageIndex + 1}`} />} />
            </div>
            {pageIndex + 2 <= numPages && (
              <div className="card" style={{ padding: 8 }}>
                <Page pageNumber={pageIndex + 2} width={spreadPageWidth} renderAnnotationLayer={false} customTextRenderer={textRenderer} loading={<PdfPageSkeleton width={spreadPageWidth} height={spreadHeight} label={`Page ${pageIndex + 2}`} />} />
              </div>
            )}
          </div>
        )}
      </Document>

      {previewOnly && numPages !== null && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0', textAlign: 'center' }}>
          <Lock size={26} color="var(--text-muted)" />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360 }}>
            You&apos;ve reached the end of the free preview. Buy or rent &ldquo;{bookTitle}&rdquo; to keep reading.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <UniversalButton variant="gold" size="sm" onClick={() => setBuyAction('SALE')}>
              Buy — {priceRwf.toLocaleString()} RWF
            </UniversalButton>
            <UniversalButton variant="gold-outline" size="sm" onClick={() => setBuyAction('RENTAL')}>
              Rent
            </UniversalButton>
          </div>
        </div>
      )}

      {mode !== 'scroll' && numPages !== null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <button
            onClick={() => goToPage(pageIndex - step)}
            disabled={pageIndex === 0}
            aria-keyshortcuts="ArrowLeft"
            className="btn btn-outline-dim btn-sm"
            style={{ opacity: pageIndex === 0 ? 0.4 : 1, cursor: pageIndex === 0 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{bookTitle}</span>
          <button
            onClick={() => goToPage(pageIndex + step)}
            disabled={pageIndex >= numPages - 1}
            aria-keyshortcuts="ArrowRight"
            className="btn btn-gold btn-sm"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}

      <BuyConfirmModal
        action={buyAction}
        resourceId={resourceId}
        bookTitle={bookTitle}
        priceRwf={priceRwf}
        onClose={() => {
          setBuyAction(null)
          loadEntitlement(entitlement?.entitled ?? false)
        }}
      />
    </div>
  )
}
