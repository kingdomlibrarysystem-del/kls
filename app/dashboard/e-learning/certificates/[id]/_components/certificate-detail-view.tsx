'use client'

import { useState } from 'react'
import { BookOpen, CalendarDays, Hash, User, ShieldAlert, ArrowLeft, ShieldOff, Award } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { CertificatePreview } from '../../_components/certificate-preview'
import { RevokeCertificateModal } from '../../_components/revoke-certificate-modal'
import { revokeCertificateAdmin, type CertificateRecord } from '../../_components/use-certificates-admin'

interface CertificateDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing) — no fetch on mount. */
  initialCertificate: CertificateRecord
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-24 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium" suppressHydrationWarning>{value}</span>
    </div>
  )
}

/**
 * Real details page for a single issued certificate, replacing the modal
 * that used to open from the Certificates table's "View" button. The
 * certificate is loaded on the server by page.tsx, so this page renders
 * with its data even when linked to directly (e.g. a verification lookup).
 */
export function CertificateDetailView({ initialCertificate }: CertificateDetailViewProps) {
  const [certificate, setCertificate] = useState<CertificateRecord | null>(initialCertificate)
  const [revoking, setRevoking] = useState(false)

  const handleRevokeConfirm = async () => {
    if (!certificate) return
    try {
      const updated = await revokeCertificateAdmin(certificate.id)
      setCertificate(updated)
    } catch {
      /* real error surfaced via a future toast; the table's admin hook already logs this pattern */
    }
    setRevoking(false)
  }

  if (!certificate) {
    return (
      <div>
        <PageHeader title="Certificate Details" />
        <EmptyState icon={Award} title="Certificate not found" description={'This certificate does not exist or was deleted.'} />
        <div className="mt-4">
          <UniversalButton href="/dashboard/e-learning/certificates" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Certificates
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/e-learning/certificates" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Certificates
        </UniversalButton>
        {!certificate.revoked && (
          <UniversalButton
            variant="destructive"
            size="sm"
            icon={<ShieldOff size={13} />}
            onClick={() => setRevoking(true)}
          >
            Revoke
          </UniversalButton>
        )}
      </div>

      <div className="max-w-2xl space-y-4">
        <CertificatePreview certificate={certificate} />

        <div className="flex items-center justify-between gap-3">
          <span className="font-lato text-xs font-semibold text-w-700 uppercase tracking-wide">Record</span>
          {certificate.revoked ? (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded border text-xs font-lato font-semibold bg-red-50 dark:bg-destructive/10 text-red-800 dark:text-destructive border-red-200 dark:border-destructive/30 shrink-0">
              <ShieldAlert size={12} /> Revoked
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded border text-xs font-lato font-semibold bg-green-50 dark:bg-success/10 text-green-800 dark:text-success border-green-200 dark:border-success/30 shrink-0">
              Valid
            </span>
          )}
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
          <DetailRow icon={<BookOpen size={13} />} label="Course" value={certificate.course} />
          <DetailRow icon={<CalendarDays size={13} />} label="Issued" value={certificate.issuedAt} />
          <DetailRow icon={<Hash size={13} />} label="Code" value={certificate.verificationCode} />
          <DetailRow icon={<User size={13} />} label="ID" value={certificate.id} />
        </div>
      </div>

      <RevokeCertificateModal certificate={revoking ? certificate : null} onClose={() => setRevoking(false)} onConfirm={handleRevokeConfirm} />
    </div>
  )
}
