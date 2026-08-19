'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { usePdfViewMode } from '@/app/member/_shared/use-pdf-view-mode'
import { PdfViewModeToggle } from './pdf-view-mode-toggle'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// pdfjs's worker can't be bundled by Next.js the normal way (it's a
// separate script pdf.js loads at runtime, not a regular import) — the
// documented-safe fix is pointing it at the exact matching version on a
// CDN, rather than trying to get Turbopack to copy/serve it from
// node_modules.
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

const PAGE_WIDTH = 640

interface PdfReaderViewProps {
  documentUrl: string
  bookTitle: string
}

/**
 * Real page-native reader for a resource's uploaded PDF (documentUrl) —
 * distinct from ReaderView's plain-text Chapter reader (which stays the
 * primary experience when real Chapter rows exist; this is used when a
 * resource has a PDF file instead of/alongside authored chapters).
 * Pages are the PDF's own real pages, not a client-side text split, so
 * "Single Page"/"Two-Page Spread" match exactly what the uploaded file
 * actually contains.
 */
export function PdfReaderView({ documentUrl, bookTitle }: PdfReaderViewProps) {
  const [mode, setMode] = usePdfViewMode()
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)

  if (loadError) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load this PDF" description={loadError} style={{ color: 'var(--text-secondary)' }} />
  }

  const goToPage = (index: number) => {
    if (numPages) setPageIndex(Math.max(0, Math.min(numPages - 1, index)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {numPages ? `Page ${pageIndex + 1} of ${numPages}` : 'Loading pages…'}
        </p>
        <PdfViewModeToggle mode={mode} onChange={setMode} />
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

      {mode !== 'scroll' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <button
            onClick={() => goToPage(pageIndex - (mode === 'spread' ? 2 : 1))}
            disabled={pageIndex === 0}
            className="btn btn-outline-dim btn-sm"
            style={{ opacity: pageIndex === 0 ? 0.4 : 1, cursor: pageIndex === 0 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={13} /> Previous
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bookTitle}</span>
          <button
            onClick={() => goToPage(pageIndex + (mode === 'spread' ? 2 : 1))}
            disabled={!numPages || pageIndex >= numPages - 1}
            className="btn btn-gold btn-sm"
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
