import Link from 'next/link'
import { Tag, Globe, Users, CalendarDays, Pencil, Trophy, ArrowUpRight } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { languageLabels } from '@/app/dashboard/e-learning/add/_components/course-form-schema'
import type { CourseAnalytics } from '@/app/dashboard/e-learning/progress/_components/progress-data'
import { courseStatusConfig, type CourseCatalogEntry } from './my-courses-data'

interface MyCourseDetailModalProps {
  course: CourseCatalogEntry | null
  /** Live enrollment/completion analytics for this course, when available — not every course has been enrolled in yet. */
  analytics?: CourseAnalytics
  onClose: () => void
  onEdit: (course: CourseCatalogEntry) => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: 'var(--gold)', marginTop: 2 }} className="shrink-0">{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 80 }} className="shrink-0">{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

/**
 * Details view for one of this contributor's own courses, with an Edit
 * action — this is the contributor's own content, and editing it writes
 * through the same shared admin course-catalog store the admin Edit Course
 * modal uses, so both sides stay in sync. Delete/Archive is intentionally
 * not offered here: removing a course affects enrolled members, which is
 * an admin-only action (see the admin catalog's Archive flow).
 */
export function MyCourseDetailModal({ course, analytics, onClose, onEdit }: MyCourseDetailModalProps) {
  return (
    <Modal open={!!course} onClose={onClose} title="Course Details" size="sm">
      {course && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="cinzel" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{course.title}</h3>
            <span
              className="shrink-0"
              style={{
                padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: `1px solid ${courseStatusConfig[course.status].border}`, background: courseStatusConfig[course.status].bg, color: courseStatusConfig[course.status].color,
              }}
            >
              {courseStatusConfig[course.status].label}
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{course.description}</p>

          <div className="card space-y-2">
            <DetailRow icon={<Tag size={13} />} label="Category" value={course.category} />
            <DetailRow icon={<Globe size={13} />} label="Language" value={languageLabels[course.language]} />
            <DetailRow icon={<Users size={13} />} label="Enrolled" value={String(course.enrolledCount)} />
            <DetailRow icon={<CalendarDays size={13} />} label="Created" value={course.createdAt} />
          </div>

          {analytics && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="flex items-center justify-between" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Average Completion</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{analytics.avgCompletion}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'var(--bg-section)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${analytics.avgCompletion}%`, background: 'var(--gold)' }} />
              </div>

              <p className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>
                <Trophy size={12} /> Top Performers
              </p>
              <ul className="space-y-1">
                {analytics.topPerformers.map((p) => (
                  <li key={p.name} className="flex items-center justify-between" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                    <span>{p.name}</span>
                    <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{p.progress}%</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard/e-learning/progress"
                className="flex items-center gap-1"
                style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2 }}
              >
                View full enrollment roster <ArrowUpRight size={12} />
              </Link>
            </div>
          )}

          <div className="flex justify-end">
            <ElegantButton type="button" variant="primary" className="flex items-center gap-2 px-4 py-2 text-sm" onClick={() => onEdit(course)}>
              <Pencil size={13} /> Edit Course
            </ElegantButton>
          </div>
        </div>
      )}
    </Modal>
  )
}
