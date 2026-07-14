'use client'

import Link from 'next/link'
import { PlayCircle, FileText, Download, CheckCircle2, AlertCircle, ClipboardList } from 'lucide-react'
import type { Lesson } from '../../../../../_shared/lesson-data'

interface LessonContentPaneProps {
  lesson: Lesson
  completed: boolean
  markError: string
  onMarkComplete: () => void
  /** Set once every lesson in the course is complete and a linked assessment exists — nudges the member to take it. */
  courseCompleteAssessmentTitle?: string
}

/**
 * Triggers a real browser download for a FILE-type lesson. There is no
 * backing file in this mocked prototype (`lesson.content` is only ever a
 * filename string), so this generates a small text placeholder client-side
 * rather than leaving the button inert or faking a network fetch.
 */
function downloadLessonFile(lessonTitle: string, fileName: string) {
  const blob = new Blob([`${lessonTitle}\n\nThis is a placeholder for "${fileName}" in the mocked prototype.`], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

/** Renders a lesson's content based on its `contentType` — video placeholder, text, or file download. */
export function LessonContentPane({ lesson, completed, markError, onMarkComplete, courseCompleteAssessmentTitle }: LessonContentPaneProps) {
  return (
    <div className="card">
      <h1 className="cinzel" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        {lesson.title}
      </h1>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>{lesson.durationMinutes} min</p>

      {lesson.contentType === 'VIDEO' && (
        <div style={{ aspectRatio: '16 / 9', background: 'var(--bg-section)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <PlayCircle size={40} />
            <p style={{ fontSize: 11, marginTop: 8 }}>{lesson.content}</p>
          </div>
        </div>
      )}

      {lesson.contentType === 'TEXT' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <FileText size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{lesson.content}</p>
        </div>
      )}

      {lesson.contentType === 'FILE' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-section)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <Download size={18} color="var(--gold)" />
          <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{lesson.content}</span>
          <button onClick={() => downloadLessonFile(lesson.title, lesson.content)} className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} aria-label={`Download ${lesson.content}`}>
            Download
          </button>
        </div>
      )}

      {markError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, padding: '8px 12px', fontSize: 11, marginBottom: 12 }}>
          <AlertCircle size={13} /> {markError}
        </div>
      )}

      <button
        onClick={onMarkComplete}
        disabled={completed}
        className={completed ? 'btn btn-outline-dim btn-sm' : 'btn btn-gold btn-sm'}
        style={completed ? { cursor: 'default' } : undefined}
      >
        <CheckCircle2 size={13} /> {completed ? 'Completed' : 'Mark Complete'}
      </button>

      {courseCompleteAssessmentTitle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--gold-light)', border: '1px solid var(--gold)', borderRadius: 8, padding: 12, marginTop: 14 }}>
          <ClipboardList size={16} color="#7a5c00" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#3a2e00', flex: 1 }}>
            You&apos;ve completed all lessons — take <strong>{courseCompleteAssessmentTitle}</strong> to finish the course.
          </span>
          <Link href="/member/assessments" className="btn btn-gold btn-sm" style={{ flexShrink: 0 }}>
            Take Assessment
          </Link>
        </div>
      )}
    </div>
  )
}
