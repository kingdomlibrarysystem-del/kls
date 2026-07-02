import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { Invitation } from './invitations-data'

interface CancelInvitationModalProps {
  invitation: Invitation | null
  onClose: () => void
  onConfirm: () => void
}

/** Cancel confirmation modal for a pending or expired invitation. */
export function CancelInvitationModal({ invitation, onClose, onConfirm }: CancelInvitationModalProps) {
  return (
    <Modal open={!!invitation} onClose={onClose} title="Cancel Invitation" size="sm">
      {invitation && (
        <div>
          <p className="font-lato text-sm text-w-700 mb-4">
            Are you sure you want to cancel the invitation sent to{' '}
            <span className="font-semibold text-w-950">{invitation.email}</span>? They will no longer be able to accept it.
          </p>
          <div className="flex gap-2">
            <ElegantButton variant="primary" onClick={onConfirm} className="flex-1 text-sm py-2 bg-red-600 border-red-700 hover:bg-red-700">
              Cancel Invitation
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
