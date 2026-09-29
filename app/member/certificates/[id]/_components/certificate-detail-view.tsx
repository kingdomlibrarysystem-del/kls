'use client'

import { ArrowLeft, Award, Download } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { CertificatePreview } from '@/app/dashboard/e-learning/certificates/_components/certificate-preview'
import type { Certificate } from '@/app/member/_shared/use-certificates'

interface CertificateDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing) — no fetch on mount. */
  initialCertificate: Certificate
}

/**
 * Real details page for a single certificate, replacing the modal that
 * used to open from both the member Certificates list and the admin
 * Downloads center's "View / Download" row. The certificate is loaded on
 * the server by page.tsx (owner-or-staff checked there). Download stays a print-to-PDF affordance, same as the
 * modal it replaces, since no real file-generation backend exists yet.
 */
export function CertificateDetailView({ initialCertificate }: CertificateDetailViewProps) {
  const certificate: Certificate | null = initialCertificate

  if (!certificate) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EmptyState
          icon={Award}
          title="Certificate not found"
          description={'This certificate does not exist or was removed.'}
          style={{ color: 'var(--text-secondary)' }}
        />
        <div>
          <UniversalButton href="/member/certificates" variant="gold-outline" icon={<ArrowLeft size={16} />}>
            Back to My Certificates
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="certificate-print-hide">
        <UniversalButton href="/member/certificates" variant="dim-outline" size="sm" icon={<ArrowLeft size={16} />}>
          Back to My Certificates
        </UniversalButton>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
        <div id="certificate-print-area">
          <CertificatePreview certificate={certificate} />
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            #certificate-print-area, #certificate-print-area * { visibility: visible; }
            #certificate-print-area { position: fixed; inset: 0; }
            .certificate-print-hide { display: none; }
          }
        `}</style>

        {!certificate.revoked && (
          <UniversalButton
            className="certificate-print-hide"
            variant="gold"
            fullWidth
            icon={<Download size={16} />}
            onClick={() => window.print()}
            aria-label={`Download certificate for ${certificate.course}`}
          >
            Download (Print to PDF)
          </UniversalButton>
        )}
      </div>
    </div>
  )
}
