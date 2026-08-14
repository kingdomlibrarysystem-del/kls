'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, BookX, Clock, ListChecks, User } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { enrollInCourse, useEnrollments } from '@/app/member/_shared/use-enrollments'
import { fetchCourseById, type CatalogCourse } from '@/app/member/_shared/use-courses'

interface CoursePreviewViewProps {
  id: string
}

/**
 * Public course preview: title, description, lesson count, duration, and an
 * Enroll CTA. Fetches the real course directly by id from /api/courses/[id]
 * (no auth required — replaces the orphaned course-preview-data.ts mock,
 * whose numeric ids never matched real Mongo ObjectIds). Signed-in users
 * are routed to the member course page; signed-out visitors are routed to
 * login first.
 */
export function CoursePreviewView({ id }: CoursePreviewViewProps) {
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState('')
  const [course, setCourse] = useState<CatalogCourse | undefined>(undefined)
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { data: enrollments } = useEnrollments()

  const alreadyEnrolled = isAuthenticated && enrollments.some((e) => e.courseId === id)

  useEffect(() => {
    let cancelled = false
    fetchCourseById(id).then((c) => {
      if (!cancelled) {
        setCourse(c)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [id])

  const handleEnroll = async () => {
    if (!course || !user) return
    setEnrolling(true)
    setEnrollError('')
    try {
      await enrollInCourse(user.id, course.id)
      router.push(`/member/courses/${course.id}`)
    } catch (error) {
      setEnrollError(error instanceof Error ? error.message : 'Could not enroll in this course')
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading course preview">
        <Skeleton className="h-8 w-2/3 rounded" />
        <Skeleton className="h-4 w-1/3 rounded" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  if (!course) {
    return (
      <EmptyState
        icon={BookX}
        title="Course not found"
        description="This course doesn't exist in the catalog."
      />
    )
  }

  const loginHref = `/auth/login?redirect=${encodeURIComponent(`/courses/${course.id}`)}`

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-w-600 mb-3">
        <GraduationCap size={20} />
        <span className="font-lato text-xs uppercase tracking-wider font-semibold">Course Preview</span>
      </div>

      <h1 className="font-cinzel text-2xl font-semibold text-w-950 mb-2">{course.title}</h1>
      <p className="font-lato text-sm text-w-700 flex items-center gap-1 mb-6">
        <User size={13} /> {course.instructor}
      </p>

      <p className="font-lato text-sm text-w-700 leading-relaxed mb-6">{course.description}</p>

      <div className="flex flex-wrap gap-4 mb-8">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-w-100 text-w-950 rounded text-xs font-lato">
          <ListChecks size={13} /> {course.lessons} lessons
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-w-100 text-w-950 rounded text-xs font-lato">
          <Clock size={13} /> {course.duration}
        </span>
      </div>

      {enrollError && (
        <div role="alert" className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {enrollError}
        </div>
      )}

      {isAuthenticated ? (
        <ElegantButton
          variant="primary"
          loading={enrolling}
          aria-label={alreadyEnrolled ? 'Continue Course' : 'Enroll in this course'}
          onClick={alreadyEnrolled ? () => router.push(`/member/courses/${course.id}`) : handleEnroll}
        >
          {alreadyEnrolled ? 'Continue Course' : 'Enroll Now'}
        </ElegantButton>
      ) : (
        <Link href={loginHref}>
          <ElegantButton variant="primary" aria-label="Sign In to Enroll">Sign In to Enroll</ElegantButton>
        </Link>
      )}
    </div>
  )
}
