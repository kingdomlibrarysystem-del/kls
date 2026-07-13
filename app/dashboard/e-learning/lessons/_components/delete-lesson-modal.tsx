'use client'

import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { removeLesson } from '@/app/member/_shared/use-lessons'
import type { LessonRow } from './lessons-config'

interface DeleteLessonModalProps {
  lesson: LessonRow | null
  onClose: () => void
}

/** Delete confirmation modal — a lesson can be safely removed since no separate completion record depends on its row surviving (enrollment progress only stores completed lesson IDs). */
export function DeleteLessonModal({ lesson, onClose }: DeleteLessonModalProps) {
  const handleConfirm = () => {
    if (!lesson) return
    try {
      removeLesson(lesson.courseId, lesson.lessonId)
      onClose()
    } catch {
      // In-memory write; failures aren't expected here.
    }
  }

  return (
    <Modal open={!!lesson} onClose={onClose} title="Delete Lesson" size="sm">
      {lesson && (
        <div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded p-3 mb-4">
            <AlertCircle size={14} className="text-amber-600 shrink-0" />
            <p className="font-lato text-xs text-amber-700">
              Deleting <span className="font-semibold">&ldquo;{lesson.title}&rdquo;</span> from {lesson.courseTitle} cannot be undone.
            </p>
          </div>
          <div className="flex gap-2">
            <ElegantButton variant="primary" onClick={handleConfirm} className="flex-1 text-sm py-2 bg-red-600 border-red-700 hover:bg-red-700">
              Delete
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
