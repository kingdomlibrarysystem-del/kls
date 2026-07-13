'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import { enrollInCourse, getNextLessonId, useEnrollments } from '@/app/member/_shared/use-enrollments'

interface CourseRedirectViewProps {
  courseId: string
}

/**
 * Enrolls the member if this is their first visit to this course (mirrors
 * what clicking "Enroll" on /member/e-learning would have done — so a
 * signed-in visitor arriving here straight from the public course preview's
 * "Go to Course" link doesn't need a separate trip to enroll), then forwards
 * to the next-incomplete-lesson URL — the same lesson "Resume"/"Continue
 * Learning" on /member/courses would pick.
 */
export function CourseRedirectView({ courseId }: CourseRedirectViewProps) {
  const router = useRouter()
  const enrollments = useEnrollments()
  const course = courseCatalog.find((c) => c.id === courseId)

  useEffect(() => {
    if (!course) return
    const existing = enrollments.find((e) => e.courseId === courseId)
    const enrollment = existing ?? enrollInCourse(courseId, course.lessons)
    const nextLessonId = getNextLessonId(enrollment)
    router.replace(
      nextLessonId ? `/member/courses/${courseId}/lessons/${nextLessonId}` : '/member/courses'
    )
    // Only re-run if the course itself changes — re-running on every
    // enrollments-store update would loop redirects as lesson progress changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  if (!course) {
    return (
      <EmptyState
        icon={BookX}
        title="Course not found"
        description="This course doesn't exist in the catalog."
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-label={`Opening ${course.title}`}>
      <Skeleton style={{ height: 24, width: '40%', borderRadius: 6 }} />
      <Skeleton style={{ height: 160, borderRadius: 8 }} />
    </div>
  )
}
