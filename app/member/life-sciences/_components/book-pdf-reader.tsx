'use client'

import { useEffect, useState } from 'react'
import { Document, pdfjs } from 'react-pdf'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { LazyPdfPage, PDF_OPTIONS } from '@/components/reader/lazy-pdf'
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
  const [ratio, setRatio] = useState(1.414)
  const [loadPercent, setLoadPercent] = useState<number | null>(null)
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
        options={PDF_OPTIONS}
        onLoadProgress={({ loaded, total }) => { if (total) setLoadPercent(Math.min(99, Math.round((loaded / total) * 100))) }}
        onLoadSuccess={(pdf) => {
          setNumPages(pdf.numPages)
          pdf.getPage(1).then((p) => { const v = p.getViewport({ scale: 1 }); if (v.width) setRatio(v.height / v.width) }).catch(() => {})
        }}
        onLoadError={(err) => setLoadError(err.message ?? 'The document failed to load.')}
        loading={
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-muted" style={{ minHeight: 420 }} role="status">
            <Loader2 className="size-9 animate-spin text-primary" />
            <p className="text-sm font-semibold text-foreground">Opening “{title}”…</p>
            {loadPercent !== null && (
              <div className="h-1.5 w-56 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${loadPercent}%` }} />
              </div>
            )}
          </div>
        }
      >
        {/* Only the pages near the screen are drawn (LazyPdfPage) — big books open fast. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          {Array.from({ length: numPages ?? 0 }, (_, i) => (
            <LazyPdfPage key={i} pageNumber={i + 1} width={pageWidth} ratio={ratio} label={title} />
          ))}
        </div>
      </Document>
    </div>
  )
}
