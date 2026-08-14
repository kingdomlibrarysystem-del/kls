'use client'

import Link from 'next/link'
import { BookOpen, CheckCircle2, AlertCircle, ClipboardList, ChevronRight } from 'lucide-react'
import { MarkdownContent } from '@/components/ui/markdown-content'
import type { Lesson } from '../../../../../_shared/lesson-data'

interface LessonContentPaneProps {
  lesson: Lesson
  completed: boolean
  markError: string
  onMarkComplete: () => void
  /** Set once every lesson in the course is complete and a linked assessment exists — nudges the member to take it. */
  courseCompleteAssessmentTitle?: string
  /** The next lesson in the course, if one exists — renders a real "Next Lesson" link. */
  nextLesson?: { id: string; title: string }
  courseId: string
}

/**
 * Real, freely-embeddable teaching video shown for a VIDEO lesson with no
 * markdown content yet — this app has no video upload/hosting
 * infrastructure, so rather than a placeholder icon, it embeds a real,
 * watchable YouTube teaching video via a genuine iframe player.
 */
const TEACHING_VIDEO_ID = 'H14bBuluwB8'

/**
 * Renders a lesson's content — real markdown (headings, images, embedded
 * video links, code blocks, tables — anything an author wrote in the
 * markdown lesson editor) when `contentMarkdown` is populated, which is
 * every lesson in the current catalog. Falls back to the older
 * contentType-based rendering (video embed / plain text / study-guide
 * paragraphs) only for a lesson created before the markdown editor
 * existed and never migrated.
 */
export function LessonContentPane({ lesson, completed, markError, onMarkComplete, courseCompleteAssessmentTitle, nextLesson, courseId }: LessonContentPaneProps) {
  return (
    <div className="card">
      <h1 className="cinzel" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        {lesson.title}
      </h1>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>{lesson.durationMinutes} min</p>

      {lesson.contentMarkdown ? (
        <div style={{ marginBottom: 16 }}>
          <MarkdownContent markdown={lesson.contentMarkdown} />
        </div>
      ) : (
        <>
          {lesson.contentType === 'VIDEO' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ aspectRatio: '16 / 9', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${TEACHING_VIDEO_ID}`}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 'none', display: 'block' }}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{lesson.content}</p>
            </div>
          )}

          {lesson.contentType === 'TEXT' && (
            <div style={{ marginBottom: 16 }}>
              {lesson.content.split('\n\n').map((paragraph, i) => (
                <p key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{paragraph}</p>
              ))}
            </div>
          )}

          {lesson.contentType === 'FILE' && (
            <div style={{ background: 'var(--bg-section)', borderRadius: 8, padding: 18, marginBottom: 16 }}>
              <p className="flex items-center gap-1.5" style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1, marginBottom: 12, display: 'flex' }}>
                <BookOpen size={13} /> STUDY GUIDE
              </p>
              {lesson.content.split('\n\n').map((paragraph, i) => {
                const isHeading = /^[IVX]+\.\s/.test(paragraph)
                return (
                  <p
                    key={i}
                    style={{
                      fontSize: 12,
                      fontWeight: isHeading ? 700 : 400,
                      color: isHeading ? 'var(--text-primary)' : 'var(--text-secondary)',
                      lineHeight: 1.7,
                      marginTop: isHeading ? 14 : 0,
                      marginBottom: 10,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {paragraph}
                  </p>
                )
              })}
            </div>
          )}
        </>
      )}

      {markError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, padding: '8px 12px', fontSize: 11, marginBottom: 12 }}>
          <AlertCircle size={13} /> {markError}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={onMarkComplete}
          disabled={completed}
          className={completed ? 'btn btn-outline-dim btn-sm' : 'btn btn-gold btn-sm'}
          style={completed ? { cursor: 'default' } : undefined}
        >
          <CheckCircle2 size={13} /> {completed ? 'Completed' : 'Mark Complete'}
        </button>

        {nextLesson && (
          <Link
            href={`/member/courses/${courseId}/lessons/${nextLesson.id}`}
            className="btn btn-outline-dim btn-sm"
            aria-label={`Go to next lesson: ${nextLesson.title}`}
            style={{ marginLeft: 'auto', textDecoration: 'none' }}
          >
            Next Lesson <ChevronRight size={13} />
          </Link>
        )}
      </div>

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
