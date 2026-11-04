'use client'

import { useState } from 'react'
import { BookX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { LessonListSidebar } from './lesson-list-sidebar'
import { LessonContentPane } from './lesson-content-pane'
import { useEnrollments, markLessonComplete } from '../../../../../_shared/use-enrollments'
import { getPublishedLessons, useLessonsByCourse } from '../../../../../_shared/use-lessons'
import { useAssessmentCatalog } from '../../../../../_shared/use-assessments'
import { useLanguage } from '@/contexts/language-context'

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
  const { t } = useLanguage()
  const [markError, setMarkError] = useState('')
  const { data: enrollments, loading: enrollmentsLoading, refetch } = useEnrollments()
  const { data: lessonsByCourse, loading: lessonsLoading } = useLessonsByCourse()
  const { data: assessmentCatalog, loading: assessmentsLoading } = useAssessmentCatalog()
  const loading = enrollmentsLoading || lessonsLoading || assessmentsLoading

  const course = lessonsByCourse[courseId]
  // Members only see published lessons; drafts stay visible in the admin store.
  const courseLessons = getPublishedLessons(course?.lessons)
  const lessonIndex = courseLessons.findIndex((l) => l.id === lessonId)
  const lesson = lessonIndex >= 0 ? courseLessons[lessonIndex] : undefined
  const enrollment = enrollments.find((e) => e.courseId === courseId)
  const completedIds = new Set(enrollment?.completedLessonIds ?? [])

  const isLastLesson = lessonIndex === courseLessons.length - 1
  const courseExam = isLastLesson
    ? Object.values(assessmentCatalog).find((a) => a.courseId === courseId && a.kind === 'EXAM')
    : undefined
  const lessonAssessment = lesson
    ? Object.values(assessmentCatalog).find(
        (a) => a.courseId === courseId && (a.kind === 'TEST' || a.kind === 'QUIZ') &&
        (a.lessonId === lesson.id || (!a.lessonId && a.kind === 'QUIZ'))
      )
    : undefined

  const handleMarkComplete = async () => {
    setMarkError('')
    try {
      if (!lesson) throw new Error(t("m_courses.lesson_not_found"))
      if (!enrollment) throw new Error(t("m_courses.not_enrolled"))
      await markLessonComplete(enrollment.id, lesson.id)
      await refetch()
    } catch (error) {
      setMarkError(error instanceof Error ? error.message : t("m_courses.could_not_mark_complete"))
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
        title={t("m_courses.lesson_not_found")}
        description={t("m_courses.lesson_not_found_desc")}
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  const displayLessons = courseLessons.map((l) => ({ ...l, completed: completedIds.has(l.id) }))
  const nextLesson = lessonIndex >= 0 && lessonIndex < courseLessons.length - 1 ? courseLessons[lessonIndex + 1] : undefined

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 items-start">
      <LessonListSidebar courseId={courseId} courseTitle={course.courseTitle} lessons={displayLessons} currentLessonId={lessonId} />
      <LessonContentPane
        lesson={lesson}
        completed={completedIds.has(lesson.id)}
        markError={markError}
        onMarkComplete={handleMarkComplete}
        courseCompleteAssessmentTitle={courseExam?.title}
        courseCompleteAssessmentId={courseExam?.id}
        lessonAssessment={lessonAssessment}
        nextLesson={nextLesson}
        courseId={courseId}
      />
    </div>
  )
}
