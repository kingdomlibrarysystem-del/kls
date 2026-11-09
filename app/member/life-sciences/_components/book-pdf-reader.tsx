'use client'

import { useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Same same-origin bundled worker the existing library reader uses — see
// app/member/library/read/[resourceId]/_components/pdf-reader-view.tsx.
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

const MAX_PAGE_WIDTH = 900
const CARD_PADDING = 16

/** Scroll-mode PDF reader for a Life Sciences book, proxied through our API. */
export function BookPdfReader({ file, title }: { file: string; title: string }) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
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

  if (loadError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load this PDF"
        description={loadError}
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  return (
    <div ref={setShell} style={{ width: '100%', minWidth: 0 }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
        {numPages ? `${numPages} page${numPages === 1 ? '' : 's'}` : 'Loading pages…'}
      </p>
      <Document
        file={file}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        onLoadError={(err) => setLoadError(err.message ?? 'The document failed to load.')}
        loading={<div style={{ height: 640, borderRadius: 8, background: 'var(--bg-section)' }} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          {Array.from({ length: numPages ?? 0 }, (_, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 8,
                maxWidth: '100%',
                overflow: 'auto',
              }}
            >
              <Page pageNumber={i + 1} width={pageWidth} aria-label={`${title} page ${i + 1}`} />
            </div>
          ))}
        </div>
      </Document>
    </div>
  )
}
