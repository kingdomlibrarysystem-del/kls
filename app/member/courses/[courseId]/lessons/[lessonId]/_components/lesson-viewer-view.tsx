'use client'

import { useState } from 'react'
import { BookX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { LessonListSidebar } from './lesson-list-sidebar'
import { LessonContentPane } from './lesson-content-pane'
import { useEnrollments, markLessonComplete } from '../../../../../_shared/use-enrollments'
import { useLessonsByCourse } from '../../../../../_shared/use-lessons'
import { useAssessmentCatalog } from '../../../../../_shared/use-assessments'

interface LessonViewerViewProps {
  courseId: string
  lessonId: string
}

/**
 * Lesson viewer: page-local lesson-list sidebar + main content pane for the
 * active lesson. "Mark complete" does a real PATCH against the member's
 * enrollment (see use-enrollments.ts's markLessonComplete), so progress is
 * immediately reflected on My Courses once the enrollment is refetched.
 */
export function LessonViewerView({ courseId, lessonId }: LessonViewerViewProps) {
  const [markError, setMarkError] = useState('')
  const { data: enrollments, loading: enrollmentsLoading, refetch } = useEnrollments()
  const { data: lessonsByCourse, loading: lessonsLoading } = useLessonsByCourse()
  const { data: assessmentCatalog, loading: assessmentsLoading } = useAssessmentCatalog()
  const loading = enrollmentsLoading || lessonsLoading || assessmentsLoading

  const course = lessonsByCourse[courseId]
  const lessonIndex = course?.lessons.findIndex((l) => l.id === lessonId) ?? -1
  const lesson = lessonIndex >= 0 ? course.lessons[lessonIndex] : undefined
  const enrollment = enrollments.find((e) => e.courseId === courseId)
  const completedIds = new Set(enrollment?.completedLessonIds ?? [])

  const allLessonsComplete = !!course && course.lessons.length > 0 && course.lessons.every((l) => completedIds.has(l.id))
  const linkedAssessment = allLessonsComplete
    ? Object.values(assessmentCatalog).find((a) => a.courseId === courseId)
    : undefined

  const handleMarkComplete = async () => {
    setMarkError('')
    try {
      if (!lesson) throw new Error('Lesson not found')
      if (!enrollment) throw new Error('You are not enrolled in this course')
      await markLessonComplete(enrollment.id, lesson.id)
      await refetch()
    } catch (error) {
      setMarkError(error instanceof Error ? error.message : 'Could not mark lesson complete')
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        <Skeleton style={{ height: 200, borderRadius: 8 }} />
        <Skeleton style={{ height: 320, borderRadius: 8 }} />
      </div>
    )
  }

  if (!course || !lesson) {
    return (
      <EmptyState
        icon={BookX}
        title="Lesson not found"
        description="This course or lesson doesn't exist in the catalog."
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  const displayLessons = course.lessons.map((l) => ({ ...l, completed: completedIds.has(l.id) }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 items-start">
      <LessonListSidebar courseId={courseId} courseTitle={course.courseTitle} lessons={displayLessons} currentLessonId={lessonId} />
      <LessonContentPane
        lesson={lesson}
        completed={completedIds.has(lesson.id)}
        markError={markError}
        onMarkComplete={handleMarkComplete}
        courseCompleteAssessmentTitle={linkedAssessment?.title}
      />
    </div>
  )
}
