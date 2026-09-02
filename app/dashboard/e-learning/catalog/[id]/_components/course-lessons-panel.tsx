'use client'

import Link from 'next/link'
import { Video, ChevronRight } from 'lucide-react'
import { useLessonsByCourse } from '@/app/member/_shared/use-lessons'
import { contentTypeConfig } from '../../../lessons/_components/lessons-config'
import { EmptyState } from '@/components/ui/empty-state'

interface CourseLessonsPanelProps {
  courseId: string
}

/** Ordered lesson list for a course's detail page — lets an admin jump straight into any lesson, or "continue" from the first one, without going through the cross-course Lessons table. */
export function CourseLessonsPanel({ courseId }: CourseLessonsPanelProps) {
  const { data: lessonsByCourse, loading } = useLessonsByCourse()
  const lessons = lessonsByCourse[courseId]?.lessons ?? []

  if (loading) return null

  if (lessons.length === 0) {
    return <EmptyState icon={Video} title="No lessons yet" description="Add the first lesson from the Lessons tab." />
  }

  return (
    <div className="divide-y divide-w-200">
      {lessons.map((lesson, index) => (
        <Link
          key={lesson.id}
          href={`/dashboard/e-learning/lessons/${lesson.id}`}
          className="flex items-center justify-between gap-3 py-2.5 hover:bg-form-highlight -mx-2 px-2 rounded transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-cinzel text-xs font-bold text-w-500 w-6 shrink-0">#{index + 1}</span>
            <div className="min-w-0">
              <p className="font-lato text-sm font-semibold text-w-950 truncate">{lesson.title}</p>
              <p className="font-lato text-xs text-w-600">{lesson.durationMinutes} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded border text-[11px] font-lato font-semibold ${contentTypeConfig[lesson.contentType].cls}`}>
              {contentTypeConfig[lesson.contentType].label}
            </span>
            <ChevronRight size={14} className="text-w-500" />
          </div>
        </Link>
      ))}
    </div>
  )
}
