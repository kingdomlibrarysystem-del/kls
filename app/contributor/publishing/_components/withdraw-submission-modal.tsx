import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { MySubmission } from './my-submissions-data'

interface WithdrawSubmissionModalProps {
  submission: MySubmission | null
  onClose: () => void
  onConfirm: () => void
}

/** Withdraw confirmation modal — only offered for DRAFT/SUBMITTED rows, before a manager has started reviewing. */
export function WithdrawSubmissionModal({ submission, onClose, onConfirm }: WithdrawSubmissionModalProps) {
  return (
    <Modal open={!!submission} onClose={onClose} title="Withdraw Submission" size="sm">
      {submission && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Are you sure you want to withdraw <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>&ldquo;{submission.title}&rdquo;</span>? This removes it from your submissions — you can resubmit it later if needed.
          </p>
          <div className="flex gap-2">
            <ElegantButton variant="primary" onClick={onConfirm} className="flex-1 text-sm py-2 bg-red-600 border-red-700 hover:bg-red-700">
              Withdraw
            </ElegantButton>
            <ElegantButton variant="outline" onClick={onClose} className="flex-1 text-sm py-2">
              Keep It
            </ElegantButton>
          </div>
        </div>
      )}
    </Modal>
  )
}
