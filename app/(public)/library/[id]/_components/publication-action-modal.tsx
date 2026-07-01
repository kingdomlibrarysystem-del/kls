'use client'

import { CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'

export type PublicationAction = 'borrow' | 'reserve' | null

interface PublicationActionModalProps {
  action: PublicationAction
  bookTitle: string
  onClose: () => void
}

/**
 * Confirms a mock Borrow/Reserve action. Visually wired but performs no
 * persistence — closing the modal is the only side effect.
 */
export function PublicationActionModal({ action, bookTitle, onClose }: PublicationActionModalProps) {
  if (!action) return null

  const verb = action === 'borrow' ? 'Borrow' : 'Reserve'

  return (
    <Modal open onClose={onClose} title={`${verb} Request`} size="sm">
      <div className="text-center py-2">
        <CheckCircle2 size={32} className="mx-auto text-green-600 mb-3" />
        <p className="font-lato text-sm text-w-950 mb-1">
          Your {verb.toLowerCase()} request for <span className="font-semibold">&ldquo;{bookTitle}&rdquo;</span> has been recorded.
        </p>
        <p className="font-lato text-xs text-w-600 mb-4">
          Sign in to your account to track this request — this preview does not persist it.
        </p>
        <ElegantButton variant="primary" onClick={onClose} className="w-full text-sm py-2">
          Close
        </ElegantButton>
      </div>
    </Modal>
  )
}
