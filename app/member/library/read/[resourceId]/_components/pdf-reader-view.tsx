'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, AlertTriangle, Download, Lock } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { UniversalButton } from '@/components/ui/universal-button'
import { usePdfViewMode } from '@/app/member/_shared/use-pdf-view-mode'
import { BuyConfirmModal, type BuyAction } from '@/app/(public)/library/_components/buy-confirm-modal'
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

const PAGE_WIDTH = 900

interface PdfReaderViewProps {
  resourceId: string
  bookTitle: string
  priceRwf: number
  /** Staff-only QA flag — forces the same paywall a non-entitled member would see. */
  forcePreview?: boolean
}

interface Entitlement {
  entitled: boolean
  freePreviewPages: number
  canDownload: boolean
}

/**
 * Real page-native reader for a resource's uploaded PDF. Unlike a plain
 * client-side page cap, the browser never receives bytes past the free
 * preview — GET /api/resources/[id]/document returns a real truncated
 * PDF (built server-side with pdf-lib) for a non-entitled viewer, and
 * the full file only once a PAID Order/active Borrow/claimed
 * Reservation exists (or the resource is free, or the viewer is
 * staff) — same entitlement rule /api/chapters already enforces for
 * text resources. Download (a separate, stronger privilege than
 * reading) is offered only after a real PAID SALE Order.
 */
export function PdfReaderView({ resourceId, bookTitle, priceRwf, forcePreview = false }: PdfReaderViewProps) {
  const [mode, setMode] = usePdfViewMode()
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null)
  const [buyAction, setBuyAction] = useState<BuyAction>(null)
  const previewQuery = forcePreview ? '?preview=1' : ''

  useEffect(() => {
    let cancelled = false
    fetch(`/api/resources/${resourceId}/entitlement${previewQuery}`)
      .then((res) => res.json())
      .then((json) => { if (!cancelled && json.code === 'success') setEntitlement(json.data) })
      .catch(() => { if (!cancelled) setEntitlement({ entitled: false, freePreviewPages: 0, canDownload: false }) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId, forcePreview])

  const backLink = (
    <Link href="/member/library" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>
      <ChevronLeft size={16} /> Back to Kingdom Library
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

  if (!entitlement) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {backLink}
        <Skeleton style={{ height: 640, borderRadius: 8 }} />
      </div>
    )
  }

  const documentUrl = `/api/resources/${resourceId}/document${previewQuery}`
  const goToPage = (index: number) => {
    if (numPages) setPageIndex(Math.max(0, Math.min(numPages - 1, index)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {backLink}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {numPages ? `Page ${pageIndex + 1} of ${numPages}${entitlement.entitled ? '' : ' (preview)'}` : 'Loading pages…'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {entitlement.canDownload && (
            <a href={`/api/resources/${resourceId}/download`} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Download size={13} /> Download
            </a>
          )}
          <PdfViewModeToggle mode={mode} onChange={setMode} />
        </div>
      </div>

      <Document
        file={documentUrl}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        onLoadError={(err) => setLoadError(err.message ?? 'The document failed to load.')}
        loading={<Skeleton style={{ height: 640, borderRadius: 8 }} />}
      >
        {mode === 'scroll' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            {Array.from({ length: numPages ?? 0 }, (_, i) => (
              <div key={i} className="card" style={{ padding: 8 }}>
                <Page pageNumber={i + 1} width={PAGE_WIDTH} />
              </div>
            ))}
          </div>
        )}

        {mode === 'single' && (
          <div className="card" style={{ padding: 8, display: 'flex', justifyContent: 'center' }}>
            <Page pageNumber={pageIndex + 1} width={PAGE_WIDTH} />
          </div>
        )}

        {mode === 'spread' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: 8 }}>
              <Page pageNumber={pageIndex + 1} width={PAGE_WIDTH / 2 - 8} />
            </div>
            {numPages && pageIndex + 2 <= numPages && (
              <div className="card" style={{ padding: 8 }}>
                <Page pageNumber={pageIndex + 2} width={PAGE_WIDTH / 2 - 8} />
              </div>
            )}
          </div>
        )}
      </Document>

      {!entitlement.entitled && numPages !== null && (
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

      {mode !== 'scroll' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <button
            onClick={() => goToPage(pageIndex - (mode === 'spread' ? 2 : 1))}
            disabled={pageIndex === 0}
            className="btn btn-outline-dim btn-sm"
            style={{ opacity: pageIndex === 0 ? 0.4 : 1, cursor: pageIndex === 0 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{bookTitle}</span>
          <button
            onClick={() => goToPage(pageIndex + (mode === 'spread' ? 2 : 1))}
            disabled={!numPages || pageIndex >= numPages - 1}
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
          fetch(`/api/resources/${resourceId}/entitlement${previewQuery}`).then((res) => res.json()).then((json) => { if (json.code === 'success') setEntitlement(json.data) })
        }}
      />
    </div>
  )
}
