'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, PlusCircle, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { myCourses, courseStatusConfig } from './my-courses-data'

/** Simulated network delay before mock courses become visible. */
const LOAD_DELAY_MS = 400

/**
 * My Courses: this contributor's courses, plus an "Add Course" entry point.
 * The entry point links to the existing admin `/dashboard/e-learning/add`
 * form rather than duplicating it here — see page-level note.
 */
export function MyCoursesView() {
  const [loading, setLoading] = useState(true)

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
          {myCourses.map((c) => (
            <div key={c.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded border text-xs font-lato font-semibold ${courseStatusConfig[c.status].cls}`}>
                  {courseStatusConfig[c.status].label}
                </span>
                <span className="flex items-center gap-1" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  <Users size={11} /> {c.enrolledCount}
                </span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.category}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
