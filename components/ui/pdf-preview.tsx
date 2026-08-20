'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Same CDN-worker fix as the member PDF reader (pdf-reader-view.tsx) —
// pdfjs's worker is a separate script, not a normal import, so Next.js
// can't bundle it; pointing at the exact matching version on a CDN is
// the documented-safe approach.
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

const PAGE_WIDTH = 320

interface PdfPreviewProps {
  url: string
}

/**
 * Lightweight inline PDF page viewer for the admin Resource form — lets
 * staff flip through the just-uploaded document's real pages without
 * leaving the modal, distinct from the full member-facing PdfReaderView
 * (which has 3 view modes and lives at the reading route) — this is a
 * one-page-at-a-time QA preview, not a reading experience.
 */
export function PdfPreview({ url }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)

  if (loadError) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs">
        <AlertTriangle size={13} /> Couldn&apos;t preview this PDF: {loadError}
      </div>
    )
  }

  return (
    <div className="border border-w-300 rounded bg-w-50 p-3">
      <Document
        file={url}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        onLoadError={(err) => setLoadError(err.message ?? 'The document failed to load.')}
        loading={<div className="h-40 flex items-center justify-center text-w-500 text-xs font-lato">Loading preview…</div>}
      >
        <div className="flex justify-center">
          <Page pageNumber={pageIndex + 1} width={PAGE_WIDTH} />
        </div>
      </Document>

      <div className="flex items-center justify-between mt-2">
        <button
          type="button"
          onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          disabled={pageIndex === 0}
          className="flex items-center gap-1 text-xs font-lato text-w-700 disabled:opacity-40 disabled:cursor-not-allowed hover:text-w-950"
        >
          <ChevronLeft size={13} /> Prev
        </button>
        <span className="text-xs font-lato text-w-600">
          {numPages ? `Page ${pageIndex + 1} of ${numPages}` : '—'}
        </span>
        <button
          type="button"
          onClick={() => setPageIndex((i) => (numPages ? Math.min(numPages - 1, i + 1) : i))}
          disabled={!numPages || pageIndex >= numPages - 1}
          className="flex items-center gap-1 text-xs font-lato text-w-700 disabled:opacity-40 disabled:cursor-not-allowed hover:text-w-950"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}
