import { Award, ShieldAlert } from 'lucide-react'
import type { Certificate } from './certificates-data'

interface CertificatePreviewProps {
  certificate: Certificate
}

/**
 * A styled, branded certificate layout — not a data table. Mirrors the
 * physical shape of a real completion certificate (ornamental border,
 * centered recipient/course, verification code as a footer stub) so admins
 * can see what the member actually receives, not just its field values.
 */
export function CertificatePreview({ certificate }: CertificatePreviewProps) {
  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{
        border: '3px double var(--gold, #d4a843)',
        background: 'linear-gradient(135deg, #fffdf7 0%, #fff 60%)',
        padding: '28px 24px',
        opacity: certificate.revoked ? 0.55 : 1,
      }}
      role="img"
      aria-label={`Certificate of completion for ${certificate.member}, course ${certificate.course}`}
    >
      {certificate.revoked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="flex items-center gap-2 px-4 py-1.5 rounded border-2 border-red-600 text-red-600 font-cinzel font-bold text-sm tracking-widest"
            style={{ transform: 'rotate(-12deg)' }}
          >
            <ShieldAlert size={16} /> REVOKED
          </span>
        </div>
      )}

      <div className="flex flex-col items-center text-center gap-1">
        <Award size={32} style={{ color: 'var(--gold, #d4a843)' }} />
        <p className="font-cinzel text-xs tracking-[3px] text-w-600 uppercase mt-1">Kingdom Library System</p>
        <h2 className="font-cinzel text-lg font-bold text-w-950 mt-2">Certificate of Completion</h2>

        <p className="font-lato text-xs text-w-600 mt-4">This certifies that</p>
        <p className="font-cinzel text-xl font-bold mt-1" style={{ color: 'var(--gold, #d4a843)' }}>{certificate.member}</p>

        <p className="font-lato text-xs text-w-600 mt-3">has successfully completed the course</p>
        <p className="font-cinzel text-base font-semibold text-w-950 mt-1">&ldquo;{certificate.course}&rdquo;</p>

        <div className="flex items-center justify-between w-full mt-6 pt-3 border-t border-dashed border-w-300">
          <div className="text-left">
            <p className="font-lato text-[10px] text-w-500 uppercase tracking-wide">Issued</p>
            <p className="font-lato text-xs text-w-800 font-semibold">{certificate.issuedAt}</p>
          </div>
          <div className="text-right">
            <p className="font-lato text-[10px] text-w-500 uppercase tracking-wide">Verification Code</p>
            <p className="font-mono text-xs text-w-800 font-semibold">{certificate.verificationCode}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
