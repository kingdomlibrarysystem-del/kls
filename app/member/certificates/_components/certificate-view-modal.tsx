'use client'

import { Download } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { CertificatePreview } from '@/app/dashboard/e-learning/certificates/_components/certificate-preview'
import type { Certificate } from '@/app/dashboard/e-learning/certificates/_components/certificates-data'

interface CertificateViewModalProps {
  certificate: Certificate | null
  onClose: () => void
}

/**
 * Member-facing certificate view — reuses the same CertificatePreview
 * component the admin side already built, rather than duplicating the
 * visual design. Download triggers the browser's print-to-PDF dialog
 * scoped to just the certificate element, since no real file-generation
 * backend exists (per the Downloads page's own disclaimer).
 */
export function CertificateViewModal({ certificate, onClose }: CertificateViewModalProps) {
  const handleDownload = () => {
    window.print()
  }

  return (
    <Modal open={!!certificate} onClose={onClose} title="Certificate" size="md">
      {certificate && (
        <div className="space-y-4">
          <div id="certificate-print-area">
            <CertificatePreview certificate={certificate} />
          </div>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #certificate-print-area, #certificate-print-area * { visibility: visible; }
              #certificate-print-area { position: fixed; inset: 0; }
            }
          `}</style>
          {!certificate.revoked && (
            <button
              onClick={handleDownload}
              aria-label={`Download certificate for ${certificate.course}`}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded text-sm font-lato font-semibold"
              style={{ background: 'var(--gold, #d4a843)', color: '#fff' }}
            >
              <Download size={14} /> Download (Print to PDF)
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}
