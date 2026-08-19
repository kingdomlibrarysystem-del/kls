import Link from 'next/link'
import { CheckCircle2, Circle, PlayCircle, FileText, BookOpen } from 'lucide-react'
import type { Lesson, LessonContentType } from '../../../../../_shared/lesson-data'

interface LessonListSidebarProps {
  courseId: string
  courseTitle: string
  lessons: Lesson[]
  currentLessonId: string
}

const contentIcon: Record<LessonContentType, React.ReactNode> = {
  VIDEO: <PlayCircle size={15} />,
  TEXT: <FileText size={15} />,
  FILE: <BookOpen size={15} />,
}

/**
 * Page-local lesson list for a single course — not the main nav sidebar.
 * Shows completed/current indicators and links to each lesson.
 */
export function LessonListSidebar({ courseId, courseTitle, lessons, currentLessonId }: LessonListSidebarProps) {
  return (
    <nav aria-label={`Lessons in ${courseTitle}`} className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
        {courseTitle}
      </div>
      {lessons.map((lesson) => {
        const isCurrent = lesson.id === currentLessonId
        return (
          <Link
            key={lesson.id}
            href={`/member/courses/${courseId}/lessons/${lesson.id}`}
            aria-current={isCurrent ? 'true' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              textDecoration: 'none',
              fontSize: 13,
              borderBottom: '1px solid var(--border-light)',
              background: isCurrent ? 'rgba(212,168,67,0.1)' : 'transparent',
              color: isCurrent ? 'var(--gold)' : 'var(--text-secondary)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {lesson.completed ? <CheckCircle2 size={16} color="var(--green-light)" /> : <Circle size={16} color="var(--text-muted)" />}
            <span style={{ flex: 1 }}>{lesson.title}</span>
            <span style={{ color: 'var(--text-muted)' }}>{contentIcon[lesson.contentType]}</span>
          </Link>
        )
      })}
    </nav>
  )
}
