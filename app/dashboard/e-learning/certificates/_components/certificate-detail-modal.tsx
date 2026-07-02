import { User, BookOpen, CalendarDays, Hash, ShieldAlert } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import type { Certificate } from './certificates-data'

interface CertificateDetailModalProps {
  certificate: Certificate | null
  onClose: () => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-24 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Read-only details view for a single issued certificate. */
export function CertificateDetailModal({ certificate, onClose }: CertificateDetailModalProps) {
  return (
    <Modal open={!!certificate} onClose={onClose} title="Certificate Details" size="sm">
      {certificate && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-cinzel text-base font-semibold text-w-950">{certificate.member}</h3>
            {certificate.revoked ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded border text-xs font-lato font-semibold bg-red-50 text-red-800 border-red-200 shrink-0">
                <ShieldAlert size={12} /> Revoked
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded border text-xs font-lato font-semibold bg-green-50 text-green-800 border-green-200 shrink-0">
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
      )}
    </Modal>
  )
}
