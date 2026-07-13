import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { CourseCatalogEntry } from './catalog-config'

interface ArchiveCourseModalProps {
  course: CourseCatalogEntry | null
  onClose: () => void
  onConfirm: () => void
}

/**
 * Archive confirmation modal. A course is reverted to Draft rather than
 * hard-deleted, since enrolled members may still hold in-progress records
 * against it — mirroring the certificate Revoke pattern in this same batch.
 */
export function ArchiveCourseModal({ course, onClose, onConfirm }: ArchiveCourseModalProps) {
  return (
    <Modal open={!!course} onClose={onClose} title="Archive Course" size="sm">
      {course && (
        <div>
          <p className="font-lato text-sm text-w-700 mb-2">
            Are you sure you want to archive <span className="font-semibold text-w-950">&ldquo;{course.title}&rdquo;</span>?
          </p>
          {course.enrolledCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded p-3 mb-4">
              <AlertCircle size={14} className="text-amber-600 shrink-0" />
              <p className="font-lato text-xs text-amber-700">
                {course.enrolledCount} member(s) are enrolled. Archiving sets the course back to Draft and hides it from new enrollments; existing enrollments are unaffected.
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <ElegantButton variant="primary" onClick={onConfirm} className="flex-1 text-sm py-2 bg-red-600 border-red-700 hover:bg-red-700">
              Archive
            </ElegantButton>
            <ElegantButton variant="outline" onClick={onClose} className="flex-1 text-sm py-2">
              Cancel
            </ElegantButton>
          </div>
        </div>
      )}
    </Modal>
  )
}
