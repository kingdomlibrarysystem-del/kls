import { Tag, Globe, Users, CalendarDays, FileText, PenLine, GraduationCap } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { languageLabels } from '../../add/_components/course-form-schema'
import { lecturerRoster } from '@/app/lecturer/_components/lecturer-identity'
import { statusConfig, type CourseCatalogEntry } from './catalog-config'

interface CourseDetailModalProps {
  course: CourseCatalogEntry | null
  onClose: () => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Read-only details view for a single course in the admin catalog. */
export function CourseDetailModal({ course, onClose }: CourseDetailModalProps) {
  return (
    <Modal open={!!course} onClose={onClose} title="Course Details" size="md">
      {course && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-cinzel text-base font-semibold text-w-950">{course.title}</h3>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${statusConfig[course.status].cls}`}>
              {statusConfig[course.status].label}
            </span>
          </div>

          <p className="font-lato text-sm text-w-700 leading-relaxed">{course.description}</p>

          <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
            <DetailRow icon={<Tag size={13} />} label="Category" value={course.category} />
            <DetailRow icon={<Globe size={13} />} label="Language" value={languageLabels[course.language]} />
            <DetailRow icon={<PenLine size={13} />} label="Author" value={course.author} />
            <DetailRow
              icon={<GraduationCap size={13} />}
              label="Instructor"
              value={course.lecturerId ? (lecturerRoster.find((l) => l.id === course.lecturerId)?.name ?? '—') : 'None assigned'}
            />
            <DetailRow icon={<Users size={13} />} label="Enrolled" value={String(course.enrolledCount)} />
            <DetailRow icon={<CalendarDays size={13} />} label="Created" value={course.createdAt} />
            <DetailRow icon={<FileText size={13} />} label="ID" value={course.id} />
          </div>
        </div>
      )}
    </Modal>
  )
}
