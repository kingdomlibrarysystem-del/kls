'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Users, Star } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RemoteImage } from '@/components/ui/remote-image'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import { LECTURER_NAME, lecturerRoster } from '@/lib/identity/lecturer-identity'

/** Simulated network delay before mock courses become visible. */
const LOAD_DELAY_MS = 400

/**
 * This lecturer's own courses, filtered from the real shared member course
 * catalog (the one learners actually browse/enroll in on
 * /member/e-learning) by `lecturerId` — the same real link this feature's
 * session-booking and course-chat phases will read from, not a separate
 * mock dataset invented just for this page.
 */
export function MyCoursesView() {
  const [loading, setLoading] = useState(true)
  const currentLecturer = lecturerRoster.find((l) => l.name === LECTURER_NAME)
  const myCourses = currentLecturer
    ? courseCatalog.filter((c) => c.lecturerId === currentLecturer.id)
    : []

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Loading my courses">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 140, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  if (myCourses.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No courses assigned"
        description="You aren't currently assigned as the lecturer for any course."
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {myCourses.map((c) => (
        <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: 90, position: 'relative', background: 'var(--bg-section)' }}>
            <RemoteImage
              src={c.image}
              alt={c.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              fallback={<GraduationCap size={28} color="var(--gold)" />}
            />
          </div>
          <div style={{ padding: '10px 12px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{c.title}</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{c.category}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={11} /> {c.students}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={11} color="var(--gold)" /> {c.rating}</span>
              <span>{c.lessons} lessons</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
