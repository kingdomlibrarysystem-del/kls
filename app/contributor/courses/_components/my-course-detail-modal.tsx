import { Tag, Globe, Users, CalendarDays } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { languageLabels } from '@/app/dashboard/e-learning/add/_components/course-form-schema'
import { courseStatusConfig, type CourseCatalogEntry } from './my-courses-data'

interface MyCourseDetailModalProps {
  course: CourseCatalogEntry | null
  onClose: () => void
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

/** Read-only details view for one of this contributor's own courses. */
export function MyCourseDetailModal({ course, onClose }: MyCourseDetailModalProps) {
  return (
    <Modal open={!!course} onClose={onClose} title="Course Details" size="sm">
      {course && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="cinzel" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{course.title}</h3>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${courseStatusConfig[course.status].cls}`}>
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
        </div>
      )}
    </Modal>
  )
}
