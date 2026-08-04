'use client'

import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { removeAssessment } from '@/app/member/_shared/use-assessments'
import type { TakeableAssessment } from './quizzes-config'

interface DeleteQuizModalProps {
  assessment: TakeableAssessment | null
  onClose: () => void
}

/** Delete confirmation modal for a quiz/exam. */
export function DeleteQuizModal({ assessment, onClose }: DeleteQuizModalProps) {
  const handleConfirm = async () => {
    if (!assessment) return
    try {
      await removeAssessment(assessment.id)
      onClose()
    } catch {
      // Real error surfaced via the assessment hook's own error state on next load.
    }
  }

  return (
    <Modal open={!!assessment} onClose={onClose} title="Delete Quiz / Exam" size="sm">
      {assessment && (
        <div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded p-3 mb-4">
            <AlertCircle size={14} className="text-amber-600 shrink-0" />
            <p className="font-lato text-xs text-amber-700">
              Deleting <span className="font-semibold">&ldquo;{assessment.title}&rdquo;</span> cannot be undone. Members who already attempted it keep their recorded results.
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
