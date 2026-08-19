'use client'

import Link from 'next/link'
import { BookOpen, ScrollText } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { useReadingProgress, getReadingProgressPercent } from '@/app/member/_shared/use-reading-progress'

/**
 * "Continue Reading" — same shape and placement convention as
 * /member/courses's "Continue Learning" card (real per-item progress
 * bar + a Resume/Continue link, not decorative), scoped to resources
 * with in-progress reading only (COMPLETED entries belong in a future
 * reading-history view, not here — matching how course.page.tsx also
 * separates in-progress from CompletedCoursesSection).
 */
export function ContinueReadingSection() {
  const { user } = useAuth()
  const { data: resources } = useResources()
  const progress = useReadingProgress(user?.id)

  const inProgress = progress
    .filter((p) => p.status === 'READING')
    .map((p) => ({ progress: p, resource: resources.find((r) => r.id === p.resourceId) }))
    .filter((row): row is { progress: typeof progress[number]; resource: NonNullable<typeof row.resource> } => !!row.resource)

  if (inProgress.length === 0) return null

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <BookOpen size={16} color="var(--gold)" /> Continue Reading
      </div>
      {inProgress.map(({ progress: p, resource }) => {
        const percent = getReadingProgressPercent(p)
        return (
          <div key={resource.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ScrollText size={22} color="var(--gold)" />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{resource.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{p.completedChapterIds.length}/{p.totalChapters} chapters</div>
              <div style={{ width: '100%', height: 4, background: 'var(--bg-section)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: 'var(--gold)', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>
            <Link
              href={`/member/library/read/${resource.id}`}
              aria-label={`Resume ${resource.title}`}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
            >
              Resume
            </Link>
          </div>
        )
      })}
    </div>
  )
}
