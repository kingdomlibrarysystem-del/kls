import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { Certificate } from './certificates-data'

interface RevokeCertificateModalProps {
  certificate: Certificate | null
  onClose: () => void
  onConfirm: () => void
}

/**
 * Revoke confirmation modal. A certificate is marked revoked rather than
 * deleted, since it may be referenced in past verification checks and
 * external records — the record itself stays for audit purposes.
 */
export function RevokeCertificateModal({ certificate, onClose, onConfirm }: RevokeCertificateModalProps) {
  return (
    <Modal open={!!certificate} onClose={onClose} title="Revoke Certificate" size="sm">
      {certificate && (
        <div>
          <p className="font-lato text-sm text-w-700 mb-2">
            Are you sure you want to revoke the certificate for{' '}
            <span className="font-semibold text-w-950">{certificate.member}</span> ({certificate.course})?
          </p>
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 mb-4">
            <AlertCircle size={14} className="text-red-600 shrink-0" />
            <p className="font-lato text-xs text-red-700">
              Verification lookups for code {certificate.verificationCode} will report this certificate as invalid. This cannot be undone from this screen.
            </p>
          </div>
          <div className="flex gap-2">
            <ElegantButton variant="primary" onClick={onConfirm} className="flex-1 text-sm py-2 bg-red-600 border-red-700 hover:bg-red-700">
              Revoke
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
