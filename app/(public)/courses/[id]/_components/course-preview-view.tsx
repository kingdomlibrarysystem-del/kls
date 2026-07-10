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
import { coursePreviews } from './course-preview-data'

/** Simulated network delay before the mock course preview becomes visible. */
const LOAD_DELAY_MS = 400

interface CoursePreviewViewProps {
  id: string
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

/**
 * Public course preview: title, description, lesson count, duration, and an
 * Enroll CTA. Signed-in users are routed to the member course page;
 * signed-out visitors are routed to login first.
 */
export function CoursePreviewView({ id }: CoursePreviewViewProps) {
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const enrollments = useEnrollments()

  const course = coursePreviews[id]
  const alreadyEnrolled = isAuthenticated && enrollments.some((e) => e.courseId === id)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const handleEnroll = () => {
    if (!course) return
    setEnrolling(true)
    enrollInCourse(course.id, course.lessons)
    router.push(`/member/courses/${course.id}`)
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
          <Clock size={13} /> {formatDuration(course.durationMinutes)}
        </span>
      </div>

      {isAuthenticated ? (
        <ElegantButton
          variant="primary"
          loading={enrolling}
          aria-label={alreadyEnrolled ? 'Continue Course' : 'Enroll in this course'}
          onClick={handleEnroll}
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
