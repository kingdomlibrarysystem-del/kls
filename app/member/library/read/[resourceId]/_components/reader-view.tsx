'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronLeft as ChevronLeftNav, BookX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'

/** Simulated network delay before the mock chapter content becomes visible. */
const LOAD_DELAY_MS = 400

interface ReaderViewProps {
  resourceId: string
  initialChapterId?: string
}

/**
 * Basic chapter reader: renders one chapter's body text at a time with
 * prev/next navigation, resolving content from the shared
 * useReadableContent() store keyed by Resource ID. Not every Resource is
 * readable yet — only the 4 seeded in Phase 0 — so a missing entry is a
 * real, expected empty state, not a bug.
 */
export function ReaderView({ resourceId, initialChapterId }: ReaderViewProps) {
  const [loading, setLoading] = useState(true)
  const resources = useResources()
  const content = useReadableContent()

  const resource = resources.find((r) => r.id === resourceId)
  const readable = content[resourceId]
  const chapters = readable?.chapters ?? []
  const startIndex = initialChapterId ? Math.max(0, chapters.findIndex((c) => c.id === initialChapterId)) : 0
  const [chapterIndex, setChapterIndex] = useState(startIndex)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading reader">
        <Skeleton style={{ height: 40, borderRadius: 8 }} />
        <Skeleton style={{ height: 320, borderRadius: 8 }} />
      </div>
    )
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720, margin: '0 auto' }}>
      <Link href="/member/library" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
        <ChevronLeft size={14} /> Back to Kingdom Library
      </Link>

      <div>
        <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{resource.title}</h1>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Chapter {chapterIndex + 1} of {chapters.length}
        </p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 className="cinzel" style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', marginBottom: 14 }}>{chapter.title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {chapter.body.split('\n\n').map((paragraph, i) => (
            <p key={i} style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)' }}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <button
          onClick={() => setChapterIndex((i) => Math.max(0, i - 1))}
          disabled={!hasPrev}
          className="btn btn-outline-dim btn-sm"
          style={{ opacity: hasPrev ? 1 : 0.4, cursor: hasPrev ? 'pointer' : 'not-allowed' }}
        >
          <ChevronLeftNav size={13} /> Previous
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{chapter.title}</span>
        <button
          onClick={() => setChapterIndex((i) => Math.min(chapters.length - 1, i + 1))}
          disabled={!hasNext}
          className="btn btn-gold btn-sm"
          style={{ opacity: hasNext ? 1 : 0.4, cursor: hasNext ? 'pointer' : 'not-allowed' }}
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}
