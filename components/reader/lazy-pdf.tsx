'use client'

import { useEffect, useRef, useState } from 'react'
import { Page } from 'react-pdf'
import { Loader2 } from 'lucide-react'

/**
 * pdf.js loading options shared by every PDF reader (module constant: react-pdf
 * reloads the document when this object changes). With our streaming API
 * (lib/server/stream-document.ts) pdf.js asks only for the bytes it needs, and
 * `disableAutoFetch` stops it downloading the rest of a big book in the
 * background — pages are fetched as the reader reaches them.
 */
export const PDF_OPTIONS = { disableAutoFetch: true, rangeChunkSize: 256 * 1024 } as const

/** Placeholder the size of a page while it loads — so the layout does not jump and the reader sees it coming. */
export function PdfPageSkeleton({ width, height, label }: { width: number; height: number; label?: string }) {
  return (
    <div
      role="status"
      aria-label={label ?? 'Loading page'}
      className="flex animate-pulse flex-col items-center justify-center gap-2 rounded bg-muted text-muted-foreground"
      style={{ width, height }}
    >
      <Loader2 className="size-6 animate-spin" />
      {label && <span className="text-xs">{label}</span>}
    </div>
  )
}

interface LazyPdfPageProps {
  pageNumber: number
  width: number
  /** Page height ÷ width (from the first page) — sizes the placeholder exactly. */
  ratio: number
  /** Called when this page fills the middle of the screen (the "current page" in scroll mode). */
  onVisible?: (pageNumber: number) => void
  label?: string
}

/**
 * One page of the scroll view that is only DRAWN when it comes near the
 * screen (and dropped again when far away). Drawing every page of a book at
 * once — the old scroll view — made big books take ages to open and slowed
 * the whole tab.
 */
export function LazyPdfPage({ pageNumber, width, ratio, onVisible, label }: LazyPdfPageProps) {
  const box = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(pageNumber <= 2)
  const height = Math.round(width * ratio)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const nearObserver = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '1500px 0px' })
    const currentObserver = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) onVisible?.(pageNumber) }, { rootMargin: '-45% 0px -45% 0px' })
    nearObserver.observe(el)
    currentObserver.observe(el)
    return () => { nearObserver.disconnect(); currentObserver.disconnect() }
  }, [pageNumber, onVisible])

  return (
    <div ref={box} id={`pdf-page-${pageNumber}`} className="card scroll-mt-24" style={{ padding: 8, minHeight: height + 16 }}>
      {near ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          renderAnnotationLayer={false}
          loading={<PdfPageSkeleton width={width} height={height} label={`Page ${pageNumber}`} />}
          aria-label={label ? `${label} — page ${pageNumber}` : `Page ${pageNumber}`}
        />
      ) : (
        <div style={{ width, height }} aria-hidden />
      )}
    </div>
  )
}

/** ← / → turn the page (single and two-page views). Ignored while typing in a box. */
export function useArrowKeys(enabled: boolean, onPrev: () => void, onNext: () => void) {
  const handlers = useRef({ onPrev, onNext })
  useEffect(() => { handlers.current = { onPrev, onNext } })
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlers.current.onPrev() }
      if (e.key === 'ArrowRight') { e.preventDefault(); handlers.current.onNext() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
