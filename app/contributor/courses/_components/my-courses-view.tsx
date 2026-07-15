'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, PlusCircle, Users, Eye } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useCourseCatalog } from '@/app/dashboard/e-learning/_shared/use-course-catalog'
import { EditCourseModal } from '@/app/dashboard/e-learning/catalog/_components/edit-course-modal'
import { courseAnalytics } from '@/app/dashboard/e-learning/progress/_components/progress-data'
import { courseStatusConfig, type CourseCatalogEntry } from './my-courses-data'
import { CONTRIBUTOR_NAME } from '@/lib/identity/contributor-identity'
import { MyCourseDetailModal } from './my-course-detail-modal'

/** Simulated network delay before mock courses become visible. */
const LOAD_DELAY_MS = 400

/**
 * My Courses: this contributor's own courses, filtered from the shared
 * admin course catalog by author — a course created via "Add Course"
 * (which links to the real admin form) appears here immediately since it's
 * attributed to this contributor. Plus an "Add Course" entry point linking
 * to the existing admin `/dashboard/e-learning/add` form rather than
 * duplicating it here — see page-level note.
 */
export function MyCoursesView() {
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<CourseCatalogEntry | null>(null)
  const [editing, setEditing] = useState<CourseCatalogEntry | null>(null)
  const catalog = useCourseCatalog()
  const myCourses = catalog.filter((c) => c.author === CONTRIBUTOR_NAME)
  const analyticsFor = (courseId: string) => courseAnalytics.find((a) => a.id === courseId)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link href="/dashboard/e-learning/add" className="btn btn-gold btn-sm" aria-label="Add a new course">
          <PlusCircle size={13} /> Add Course
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Loading my courses">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 88, borderRadius: 8 }} />
          ))}
        </div>
      ) : myCourses.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No courses yet" description="Use Add Course above to create your first course." style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myCourses.map((c) => {
            const analytics = analyticsFor(c.id)
            return (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="flex items-start justify-between gap-2">
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{c.title}</p>
                  <span
                    className="shrink-0"
                    style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                      border: `1px solid ${courseStatusConfig[c.status].border}`, background: courseStatusConfig[c.status].bg, color: courseStatusConfig[c.status].color,
                    }}
                  >
                    {courseStatusConfig[c.status].label}
                  </span>
                </div>

                <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.description}</p>

                <div className="flex items-center justify-between" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  <span>{c.category}</span>
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {c.enrolledCount} enrolled
                  </span>
                </div>

                {analytics && (
                  <div>
                    <div className="flex items-center justify-between" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>
                      <span>Average Completion</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{analytics.avgCompletion}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-section)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${analytics.avgCompletion}%`, background: 'var(--gold)' }} />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setViewing(c)}
                  aria-label={`View details for ${c.title}`}
                  className="flex items-center justify-center gap-1.5"
                  style={{ marginTop: 4, padding: '6px 0', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Eye size={12} /> View Details
                </button>
              </div>
            )
          })}
        </div>
      )}

      <MyCourseDetailModal
        course={viewing}
        analytics={viewing ? analyticsFor(viewing.id) : undefined}
        onClose={() => setViewing(null)}
        onEdit={(c) => { setViewing(null); setEditing(c) }}
      />
      <EditCourseModal course={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
