'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { kindConfig, type AssessmentKind } from '../../../quizzes/_components/quizzes-config'

interface CourseQuizzesPanelProps {
  courseId: string
}

interface QuizRow {
  id: string
  title: string
  kind: AssessmentKind
  questions?: { id: string }[]
}

/** Quizzes/exams/projects attached to this course — no shared cross-course store exists for assessments yet (unlike lessons/enrollments), so this fetches directly scoped to courseId. */
export function CourseQuizzesPanel({ courseId }: CourseQuizzesPanelProps) {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/assessments?courseId=${courseId}`)
      .then((res) => res.json())
      .then((json) => { if (!cancelled && json.code === 'success') setQuizzes(json.data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId])

  if (loading) return null

  if (quizzes.length === 0) {
    return <EmptyState icon={ClipboardList} title="No quizzes yet" description="Add a quiz, exam, or project from the Quizzes & Exams tab." />
  }

  return (
    <div className="divide-y divide-w-200">
      {quizzes.map((q) => (
        <Link
          key={q.id}
          href={`/dashboard/e-learning/quizzes/${q.id}`}
          className="flex items-center justify-between gap-3 py-2.5 hover:bg-form-highlight -mx-2 px-2 rounded transition-colors"
        >
          <div className="min-w-0">
            <p className="font-lato text-sm font-semibold text-w-950 truncate">{q.title}</p>
            {q.questions && <p className="font-lato text-xs text-w-600">{q.questions.length} question{q.questions.length === 1 ? '' : 's'}</p>}
          </div>
          <span className={`px-2 py-0.5 rounded border text-[11px] font-lato font-semibold shrink-0 ${kindConfig[q.kind].cls}`}>
            {kindConfig[q.kind].label}
          </span>
        </Link>
      ))}
    </div>
  )
}
