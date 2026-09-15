'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { useCourses } from '@/app/member/_shared/use-courses'
import { enrollInCourse, getNextLessonId, useEnrollments } from '@/app/member/_shared/use-enrollments'
import { useLessonsByCourse } from '@/app/member/_shared/use-lessons'
import { useLanguage } from '@/contexts/language-context'

interface CourseRedirectViewProps {
  courseId: string
}

/**
 * Enrolls the member if this is their first visit to this course (mirrors
 * what clicking "Enroll" on /member/e-learning would have done — so a
 * signed-in visitor arriving here straight from the public course preview's
 * "Go to Course" link doesn't need a separate trip to enroll), then forwards
 * to the next-incomplete-lesson URL — the same lesson "Resume"/"Continue
 * Learning" on /member/courses would pick. Enrollment is a real
 * POST /api/enrollments call against the signed-in session's real userId.
 */
export function CourseRedirectView({ courseId }: CourseRedirectViewProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [error, setError] = useState('')
  const { data: enrollments, loading: enrollmentsLoading, refetch } = useEnrollments()
  const { data: courseCatalog, loading: coursesLoading } = useCourses()
  const { data: lessonsByCourse, loading: lessonsLoading } = useLessonsByCourse()
  const course = courseCatalog.find((c) => c.id === courseId)
  const loading = enrollmentsLoading || coursesLoading || lessonsLoading

  useEffect(() => {
    if (loading || !course || !user) return

    async function redirect() {
      try {
        const existing = enrollments.find((e) => e.courseId === courseId)
        let enrollment = existing
        if (!enrollment) {
          enrollment = await enrollInCourse(user!.id, courseId)
          await refetch()
        }
        const lessons = lessonsByCourse[courseId]?.lessons
        const nextLessonId = getNextLessonId(enrollment, lessons)
        router.replace(nextLessonId ? `/member/courses/${courseId}/lessons/${nextLessonId}` : '/member/courses')
      } catch (err) {
        setError(err instanceof Error ? err.message : t("m_courses.could_not_open_course"))
      }
    }
    redirect()
    // Only re-run if the course itself or loading state changes — re-running
    // on every enrollments refetch would loop redirects as progress changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, loading])

  if (!loading && !course) {
    return (
      <EmptyState
        icon={BookX}
        title={t("m_courses.course_not_found")}
        description={t("m_courses.course_not_found_desc")}
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={BookX}
        title={t("m_courses.could_not_open_course")}
        description={error}
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-label={`${t("m_courses.opening_course")} ${course?.title ?? t("m_courses.course_word")}`}>
      <Skeleton style={{ height: 24, width: '40%', borderRadius: 6 }} />
      <Skeleton style={{ height: 160, borderRadius: 8 }} />
    </div>
  )
}
