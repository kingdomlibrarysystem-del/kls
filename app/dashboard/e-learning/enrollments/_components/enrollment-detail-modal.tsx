import { User, BookOpen, CalendarDays, Percent } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { enrollmentStatusConfig, type Enrollment } from './enrollments-data'

interface EnrollmentDetailModalProps {
  enrollment: Enrollment | null
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

/** Read-only details view for a single member enrollment. */
export function EnrollmentDetailModal({ enrollment, onClose }: EnrollmentDetailModalProps) {
  return (
    <Modal open={!!enrollment} onClose={onClose} title="Enrollment Details" size="sm">
      {enrollment && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-cinzel text-base font-semibold text-w-950">{enrollment.member}</h3>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${enrollmentStatusConfig[enrollment.status].cls}`}>
              {enrollmentStatusConfig[enrollment.status].label}
            </span>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
            <DetailRow icon={<BookOpen size={13} />} label="Course" value={enrollment.course} />
            <DetailRow icon={<CalendarDays size={13} />} label="Enrolled" value={enrollment.enrolledAt} />
            <DetailRow icon={<Percent size={13} />} label="Progress" value={`${enrollment.progress}%`} />
            <DetailRow icon={<User size={13} />} label="ID" value={enrollment.id} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-lato text-xs text-w-700">Course Progress</span>
              <span className="font-lato text-xs text-w-700 font-semibold">{enrollment.progress}%</span>
            </div>
            <div className="h-2 bg-w-200 rounded-full overflow-hidden">
              <div className="h-full bg-w-600 rounded-full" style={{ width: `${enrollment.progress}%` }} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
