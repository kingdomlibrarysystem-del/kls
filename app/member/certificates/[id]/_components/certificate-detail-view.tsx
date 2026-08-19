'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Award, Download } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { CertificatePreview } from '@/app/dashboard/e-learning/certificates/_components/certificate-preview'
import type { Certificate } from '@/app/member/_shared/use-certificates'

interface CertificateDetailViewProps {
  id: string
}

/**
 * Real details page for a single certificate, replacing the modal that
 * used to open from both the member Certificates list and the admin
 * Downloads center's "View / Download" row. Fetches directly from
 * /api/certificates/:id so this page also works when linked to
 * directly (e.g. shared verification links) without either list being
 * loaded first. Download stays a print-to-PDF affordance, same as the
 * modal it replaces, since no real file-generation backend exists yet.
 */
export function CertificateDetailView({ id }: CertificateDetailViewProps) {
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/certificates/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'Certificate not found')
          return
        }
        setCertificate(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load certificate') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading certificate">
        <Skeleton style={{ height: 32, width: 160, borderRadius: 6 }} />
        <Skeleton style={{ height: 220, borderRadius: 8 }} />
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EmptyState
          icon={Award}
          title="Certificate not found"
          description={error || 'This certificate does not exist or was removed.'}
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
