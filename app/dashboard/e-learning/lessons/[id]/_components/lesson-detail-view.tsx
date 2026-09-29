'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Trash2, Video } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { MarkdownContent } from '@/components/ui/markdown-content'
import { EditLessonModal } from '../../_components/edit-lesson-modal'
import { DeleteLessonModal } from '../../_components/delete-lesson-modal'
import { contentTypeConfig, type LessonRow } from '../../_components/lessons-config'

/** A neighbouring lesson in the same course, for the prev/next buttons and "Lesson N of M". */
export interface SiblingLesson {
  id: string
  title: string
}

interface LessonDetailViewProps {
  /** GET /api/lessons/[id] shape, loaded on the server by page.tsx (which 404s when missing). */
  initialLesson: LessonApiResponse
  /** Parent course title, resolved server-side. */
  courseTitle: string
  /** Every lesson of the parent course in order, loaded server-side. */
  siblings: SiblingLesson[]
}

export interface LessonApiResponse {
  id: string
  courseId: string
  title: string
  contentType: LessonRow['contentType']
  durationMinutes: number
  content: string
  contentMarkdown?: string
  order: number
}

/**
 * Real details page for a single lesson, replacing the modal that used to
 * open from the admin Lessons table's "View" button. The lesson, its course
 * title and its sibling lessons all arrive from the server page — previously
 * this view downloaded the whole course catalog and every lesson of every
 * course just to show one title and the prev/next links.
 */
export function LessonDetailView({ initialLesson, courseTitle, siblings }: LessonDetailViewProps) {
  const id = initialLesson.id
  const router = useRouter()
  const [lesson, setLesson] = useState<LessonApiResponse | null>(initialLesson)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!lesson) {
    return (
      <div>
        <PageHeader title="Lesson Details" />
        <EmptyState icon={Video} title="Lesson not found" description="This lesson does not exist or was deleted." />
        <div className="mt-4">
          <UniversalButton href="/dashboard/e-learning/lessons" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Lessons
          </UniversalButton>
        </div>
      </div>
    )
  }

  const handleDeleteClose = async () => {
    setDeleting(false)
    const res = await fetch(`/api/lessons/${id}`)
    const json = await res.json()
    if (json.code !== 'success' || !json.data) {
      router.push('/dashboard/e-learning/lessons')
    } else {
      setLesson(json.data)
    }
  }

  const row: LessonRow = {
    courseId: lesson.courseId,
    courseTitle,
    lessonId: lesson.id,
    order: lesson.order,
    title: lesson.title,
    contentType: lesson.contentType,
    durationMinutes: lesson.durationMinutes,
    content: lesson.content,
    contentMarkdown: lesson.contentMarkdown,
  }

  const position = siblings.findIndex((l) => l.id === lesson.id)
  const prevLesson = position > 0 ? siblings[position - 1] : null
  const nextLesson = position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/e-learning/lessons" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Lessons
        </UniversalButton>
        <div className="flex gap-2">
          <UniversalButton variant="outline" size="sm" icon={<Pencil size={13} />} onClick={() => setEditing(true)}>
            Edit
          </UniversalButton>
          <UniversalButton
            variant="destructive"
            size="sm"
            icon={<Trash2 size={13} />}
            onClick={() => setDeleting(true)}
          >
            Delete
          </UniversalButton>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{lesson.title}</h1>
          <p className="font-lato text-sm text-w-600 mt-0.5">{courseTitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${contentTypeConfig[lesson.contentType].cls}`}>
            {contentTypeConfig[lesson.contentType].label}
          </span>
          <span className="font-lato text-xs text-w-600">Order #{lesson.order} &bull; {lesson.durationMinutes} min</span>
          {siblings.length > 0 && position >= 0 && (
            <span className="font-lato text-xs text-w-600">&bull; Lesson {position + 1} of {siblings.length}</span>
          )}
        </div>

        {siblings.length > 0 && (
          <div className="h-1.5 rounded-full bg-w-200 dark:bg-white/10 overflow-hidden max-w-md">
            <div className="h-full bg-w-600" style={{ width: `${((position + 1) / siblings.length) * 100}%` }} />
          </div>
        )}

        <div className="bg-w-100 border border-w-300 rounded-lg p-4">
          <p className="font-lato text-xs font-semibold text-w-950 mb-2">Summary</p>
          <p className="font-lato text-sm text-w-700 whitespace-pre-wrap leading-relaxed">{lesson.content}</p>
        </div>

        {lesson.contentMarkdown && (
          <div className="bg-w-100 border border-w-300 rounded-lg p-6">
            <p className="font-lato text-xs font-semibold text-w-950 mb-4">Lesson Content Preview</p>
            <MarkdownContent markdown={lesson.contentMarkdown} />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-w-200">
          {prevLesson ? (
            <UniversalButton href={`/dashboard/e-learning/lessons/${prevLesson.id}`} variant="outline" size="sm" icon={<ChevronLeft size={14} />}>
              {prevLesson.title}
            </UniversalButton>
          ) : <span />}
          {nextLesson && (
            <UniversalButton href={`/dashboard/e-learning/lessons/${nextLesson.id}`} variant="outline" size="sm">
              {nextLesson.title} <ChevronRight size={14} />
            </UniversalButton>
          )}
        </div>
      </div>

      <EditLessonModal
        lesson={editing ? row : null}
        onClose={() => {
          setEditing(false)
          // Re-run the server page so the title/siblings reflect the edit (they used to come from the shared lessons store).
          router.refresh()
        }}
      />
      <DeleteLessonModal lesson={deleting ? row : null} onClose={handleDeleteClose} />
    </div>
  )
}
