import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { PlatformUser } from './users-data'

interface DeleteUserModalProps {
  user: PlatformUser | null
  onClose: () => void
  onConfirm: (user: PlatformUser) => void
}

/** Confirmation modal before permanently removing a user row. */
export function DeleteUserModal({ user, onClose, onConfirm }: DeleteUserModalProps) {
  return (
    <Modal open={!!user} onClose={onClose} title="Delete User" size="sm">
      {user && (
        <div>
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 mb-4">
            <AlertTriangle size={14} className="text-red-600 shrink-0" />
            <p className="font-lato text-xs text-red-700">This action cannot be undone.</p>
          </div>
          <p className="font-lato text-sm text-w-700 mb-4">
            Are you sure you want to delete <span className="font-semibold text-w-950">&ldquo;{user.name}&rdquo;</span>?
          </p>
          <div className="flex gap-2">
            <ElegantButton
              variant="primary"
              onClick={() => onConfirm(user)}
              className="flex-1 text-sm py-2 bg-red-600 border-red-700 hover:bg-red-700"
            >
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
