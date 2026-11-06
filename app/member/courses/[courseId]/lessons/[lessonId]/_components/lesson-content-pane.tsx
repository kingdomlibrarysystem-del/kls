'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, CheckCircle2, AlertCircle, ClipboardList, ChevronRight } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { OpenClassPanel } from '../../../../../_shared/open-class-panel'
import { MarkdownContent } from '@/components/ui/markdown-content'
import type { Lesson } from '../../../../../_shared/lesson-data'
import type { TakeableAssessment } from '../../../../../_shared/assessment-data'
import type { AssessmentAttempt } from '../../../../../_shared/use-assessment-attempts'
import { LessonQuizInline } from './lesson-quiz-inline'
import { useLanguage } from '@/contexts/language-context'

interface LessonContentPaneProps {
  lesson: Lesson
  completed: boolean
  markError: string
  onMarkComplete: () => void
  /** Set on the last lesson when a linked exam exists — nudges the member to take it. */
  courseCompleteAssessmentTitle?: string
  courseCompleteAssessmentId?: string
  /** Per-lesson TEST or QUIZ — rendered inline under the lesson content when present. */
  lessonAssessment?: TakeableAssessment
  /** The next lesson in the course, if one exists — renders a real "Next Lesson" link. */
  nextLesson?: { id: string; title: string }
  courseId: string
  /** The member's one attempt at lessonAssessment, once done (no second try). */
  quizAttempt?: AssessmentAttempt
  /** The member's one attempt at the final exam, once done — the exam card then shows the marks. */
  examAttempt?: AssessmentAttempt
  /** Set once the whole course is COMPLETED — the Open class panel then shows under the lesson. */
  completedCourse?: { id: string; title: string; lecturerId?: string }
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
export function LessonContentPane({ lesson, completed, markError, onMarkComplete, courseCompleteAssessmentTitle, courseCompleteAssessmentId, lessonAssessment, nextLesson, courseId, quizAttempt, examAttempt, completedCourse }: LessonContentPaneProps) {
  const { t } = useLanguage()
  const [quizOpen, setQuizOpen] = useState(false)
  const [justTookQuiz, setJustTookQuiz] = useState(false)
  const [askSkip, setAskSkip] = useState(false)
  const tookQuiz = !!quizAttempt || justTookQuiz

  // Completing is always allowed; if the lesson has a quiz the member hasn't taken, ask first.
  const complete = () => {
    if (lessonAssessment && !tookQuiz) { setAskSkip(true); return }
    onMarkComplete()
  }
  const takeQuiz = () => {
    setAskSkip(false)
    setQuizOpen(true)
    requestAnimationFrame(() => document.getElementById('lesson-quiz')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  return (
    <div className="card">
      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        {lesson.title}
      </h1>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{lesson.durationMinutes} {t("m_courses.min")}</p>

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
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{lesson.content}</p>
            </div>
          )}

          {lesson.contentType === 'TEXT' && (
            <div style={{ marginBottom: 16 }}>
              {lesson.content.split('\n\n').map((paragraph, i) => (
                <p key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{paragraph}</p>
              ))}
            </div>
          )}

          {lesson.contentType === 'FILE' && (
            <div style={{ background: 'var(--bg-section)', borderRadius: 8, padding: 18, marginBottom: 16 }}>
              <p className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1, marginBottom: 12, display: 'flex' }}>
                <BookOpen size={15} /> {t("m_courses.study_guide")}
              </p>
              {lesson.content.split('\n\n').map((paragraph, i) => {
                const isHeading = /^[IVX]+\.\s/.test(paragraph)
                return (
                  <p
                    key={i}
                    style={{
                      fontSize: 14,
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

      {lessonAssessment && (
        <LessonQuizInline assessment={lessonAssessment} open={quizOpen} onOpenChange={setQuizOpen} attempt={quizAttempt} onSubmitted={() => setJustTookQuiz(true)} />
      )}

      {markError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
          <AlertCircle size={15} /> {markError}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={complete}
          disabled={completed}
          className={completed ? 'btn btn-outline-dim btn-sm' : 'btn btn-gold btn-sm'}
          style={completed ? { cursor: 'default' } : undefined}
        >
          <CheckCircle2 size={15} /> {completed ? t("common.completed") : t("m_courses.mark_complete")}
        </button>

        {nextLesson && (
          <Link
            href={`/member/courses/${courseId}/lessons/${nextLesson.id}`}
            className="btn btn-outline-dim btn-sm"
            aria-label={`${t("m_courses.go_to_next_lesson")}: ${nextLesson.title}`}
            style={{ marginLeft: 'auto', textDecoration: 'none' }}
          >
            {t("m_courses.next_lesson")} <ChevronRight size={15} />
          </Link>
        )}
      </div>

      {courseCompleteAssessmentTitle && (examAttempt ? (
        // Exam already done: show the marks — it cannot be taken again.
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-success/40 bg-success/5 p-3">
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
          <span className="min-w-0 flex-1 text-sm text-foreground">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-success">{t('m_quiz.exam_done')}</span>
            <strong>{courseCompleteAssessmentTitle}</strong>
            <span className="block text-xs text-muted-foreground">
              {examAttempt.reviewStatus === 'PENDING_REVIEW' ? t('m_quiz.waiting_review') : examAttempt.status === 'PASSED' ? t('m_quiz.passed') : t('m_quiz.not_passed')}
            </span>
          </span>
          <span className="text-right">
            <span className="block text-xs text-muted-foreground">{t('m_quiz.your_marks')}</span>
            <span className="font-cinzel text-xl font-bold text-foreground">{examAttempt.score} / {examAttempt.totalMarks}</span>
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--gold-light)', border: '1px solid var(--gold)', borderRadius: 8, padding: 12, marginTop: 14 }}>
          <ClipboardList size={18} color="#7a5c00" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: '#3a2e00', flex: 1 }}>
            {t("m_courses.all_lessons_complete_take")} <strong>{courseCompleteAssessmentTitle}</strong> {t("m_courses.to_finish_course")}
            <span style={{ display: 'block', fontSize: 12, marginTop: 2 }}>{t('m_quiz.one_try')}</span>
          </span>
          <Link href={`/member/assessments/${courseCompleteAssessmentId}/take`} className="btn btn-gold btn-sm" style={{ flexShrink: 0 }}>
            {t("m_courses.take_assessment")}
          </Link>
        </div>
      ))}
      {completedCourse && (
        <div style={{ marginTop: 18 }}>
          <OpenClassPanel course={completedCourse} />
        </div>
      )}

      <Modal open={askSkip} onClose={() => setAskSkip(false)} title={t('m_quiz.skip_title')} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('m_quiz.skip_text')}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => { setAskSkip(false); onMarkComplete() }}>{t('m_quiz.complete_anyway')}</Button>
            <Button onClick={takeQuiz}><ClipboardList /> {t('m_quiz.take_quiz')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
