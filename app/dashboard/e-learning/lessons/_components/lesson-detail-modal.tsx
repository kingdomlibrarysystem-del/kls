import { Modal } from '@/components/ui/modal'
import { contentTypeConfig, type LessonRow } from './lessons-config'

interface LessonDetailModalProps {
  lesson: LessonRow | null
  onClose: () => void
}

/** Read-only details view for a single lesson. */
export function LessonDetailModal({ lesson, onClose }: LessonDetailModalProps) {
  return (
    <Modal open={!!lesson} onClose={onClose} title="Lesson Details" size="md">
      {lesson && (
        <div className="space-y-3">
          <div>
            <p className="font-cinzel text-sm font-semibold text-w-950">{lesson.title}</p>
            <p className="text-xs text-w-600 mt-0.5">{lesson.courseTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${contentTypeConfig[lesson.contentType].cls}`}>
              {contentTypeConfig[lesson.contentType].label}
            </span>
            <span className="text-xs text-w-600">Order #{lesson.order} • {lesson.durationMinutes} min</span>
          </div>
          <div className="bg-w-100 border border-w-300 rounded p-3">
            <p className="text-xs font-semibold text-w-950 mb-1">Content</p>
            <p className="text-sm text-w-700 whitespace-pre-wrap">{lesson.content}</p>
          </div>
        </div>
      )}
    </Modal>
  )
}
