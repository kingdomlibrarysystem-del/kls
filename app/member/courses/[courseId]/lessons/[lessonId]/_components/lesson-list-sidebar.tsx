'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ChevronDown, ClipboardCheck, FileText, FolderKanban, Lock, Paperclip, PlayCircle } from 'lucide-react'
import type { Lesson, LessonContentType } from '../../../../../_shared/lesson-data'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'
import { lessonCode } from '@/lib/course-code'

/** The course's exam and projects, listed under the lessons. */
export interface SidebarAssessment {
  id: string
  title: string
  kind: 'EXAM' | 'PROJECT'
  done: boolean
}

interface LessonListSidebarProps {
  courseId: string
  courseTitle: string
  /** Short course code, e.g. "SSL" — lessons are numbered "SSL 01", "SSL 02"… */
  code: string
  lessons: Lesson[]
  currentLessonId: string
  /** Empty while a paid course is not paid (the exam and projects are closed). */
  assessments?: SidebarAssessment[]
}

const contentIcon: Record<LessonContentType, typeof FileText> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  FILE: Paperclip,
}

/**
 * Page-local lesson list for a single course — not the main nav sidebar.
 * On wide screens it stays in place (sticky, with its own scroll) while the
 * lesson is read; on phones it folds into a "Lessons" button above the
 * lesson. Shows progress, numbered lessons (course code + 01), done/locked
 * marks, and the course's exam and projects at the end.
 */
export function LessonListSidebar({ courseId, courseTitle, code, lessons, currentLessonId, assessments = [] }: LessonListSidebarProps) {
  const { t } = useLanguage()
  const [openOnPhone, setOpenOnPhone] = useState(false)
  const listRef = useRef<HTMLOListElement>(null)
  const done = lessons.filter((l) => l.completed).length
  const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0

  // Keep the current lesson visible inside the list (scrolls only the list, not the page).
  useEffect(() => {
    const list = listRef.current
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !current) return
    const top = current.offsetTop - list.clientHeight / 2 + current.clientHeight / 2
    list.scrollTo({ top: Math.max(0, top) })
  }, [currentLessonId])

  return (
    <nav
      aria-label={`${t('m_courses.lessons_in')} ${courseTitle}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm md:sticky md:top-0 md:max-h-[calc(100vh-60px-2rem)]"
    >
      {/* Course header + progress */}
      <div className="shrink-0 border-b border-border bg-gradient-to-br from-[#1a3d5c] via-[#12304a] to-[#0b2136] p-4 text-[#f6efe0]">
        <Link href="/member/courses" className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#f6efe0]/70 transition hover:text-primary">
          <ArrowLeft className="size-3.5" /> {t('m_courses.my_courses')}
        </Link>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-[#0b2136]">{code}</span>
          <h2 className="text-sm font-bold leading-snug">{courseTitle}</h2>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </span>
          <span className="text-xs font-semibold tabular-nums">{percent}%</span>
        </div>
        <p className="mt-1 text-xs text-[#f6efe0]/70">
          {t('m_courses.lessons_done').replace('{done}', String(done)).replace('{total}', String(lessons.length))}
        </p>
      </div>

      {/* Phones: the list folds away so the lesson comes first. */}
      <button
        type="button"
        onClick={() => setOpenOnPhone((o) => !o)}
        aria-expanded={openOnPhone}
        className="flex items-center justify-between px-4 py-3 text-sm font-semibold md:hidden"
      >
        {openOnPhone ? t('m_courses.hide_lessons') : `${t('m_courses.show_lessons')} (${lessons.length})`}
        <ChevronDown className={cn('size-4 transition-transform', openOnPhone && 'rotate-180')} />
      </button>

      <div className={cn('min-h-0 flex-1 flex-col md:flex', openOnPhone ? 'flex' : 'hidden')}>
        <ol ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {lessons.map((lesson, i) => {
            const isCurrent = lesson.id === currentLessonId
            const Icon = contentIcon[lesson.contentType] ?? FileText
            return (
              <li key={lesson.id}>
                <Link
                  href={`/member/courses/${courseId}/lessons/${lesson.id}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => setOpenOnPhone(false)}
                  className={cn(
                    'group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors',
                    isCurrent ? 'bg-primary/15' : 'hover:bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-6 min-w-12 shrink-0 items-center justify-center rounded-md px-1.5 text-[11px] font-bold tabular-nums',
                      lesson.completed
                        ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400'
                        : isCurrent
                          ? 'bg-[#12304a] text-[#f6efe0] dark:bg-primary dark:text-[#0b2136]'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {lessonCode(code, i)}
                  </span>
                  <span className={cn('min-w-0 flex-1 text-sm leading-snug', isCurrent ? 'font-semibold text-[#12304a] dark:text-primary' : 'text-foreground/85')}>
                    {lesson.title}
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                      <Icon className="size-3" />
                      {lesson.durationMinutes > 0 && `${lesson.durationMinutes} ${t('m_courses.min')}`}
                    </span>
                  </span>
                  <span className="mt-0.5 shrink-0">
                    {lesson.completed ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-label={t('common.completed')} />
                    ) : lesson.locked ? (
                      <Lock className="size-4 text-[#a07830] dark:text-primary" aria-label="Needs payment" />
                    ) : null}
                  </span>
                </Link>
              </li>
            )
          })}

          {assessments.length > 0 && (
            <>
              <li className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('m_courses.exam_and_projects')}</li>
              {assessments.map((a) => {
                const Icon = a.kind === 'EXAM' ? ClipboardCheck : FolderKanban
                return (
                  <li key={a.id}>
                    <Link href={`/member/assessments/${a.id}/take`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[#a07830] dark:text-primary">
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-snug text-foreground/85">{a.title}</span>
                      {a.done && <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label={t('common.completed')} />}
                    </Link>
                  </li>
                )
              })}
            </>
          )}
        </ol>
      </div>
    </nav>
  )
}
