'use client'

import { useState, useEffect } from 'react'
import { BookX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { courseLessons } from './lesson-data'
import { LessonListSidebar } from './lesson-list-sidebar'
import { LessonContentPane } from './lesson-content-pane'

/** Simulated network delay before mock lesson data becomes visible. */
const LOAD_DELAY_MS = 400

interface LessonViewerViewProps {
  courseId: string
  lessonId: string
}

/**
 * Lesson viewer: page-local lesson-list sidebar + main content pane for the
 * active lesson. "Mark complete" updates local state only (no persistence
 * across reload).
 */
export function LessonViewerView({ courseId, lessonId }: LessonViewerViewProps) {
  const [loading, setLoading] = useState(true)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [markError, setMarkError] = useState('')

  const course = courseLessons[courseId]
  const lessonIndex = course?.lessons.findIndex((l) => l.id === lessonId) ?? -1
  const lesson = lessonIndex >= 0 ? course.lessons[lessonIndex] : undefined

  useEffect(() => {
    const timer = setTimeout(() => {
      if (course) setCompletedIds(new Set(course.lessons.filter((l) => l.completed).map((l) => l.id)))
      setLoading(false)
    }, LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [course])

  const handleMarkComplete = () => {
    setMarkError('')
    try {
      if (!lesson) throw new Error('Lesson not found')
      setCompletedIds((prev) => new Set(prev).add(lesson.id))
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
        description="This course or lesson doesn't exist in the mock catalog."
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
      />
    </div>
  )
}
