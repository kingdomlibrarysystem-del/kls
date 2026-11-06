import Image from 'next/image'
import { ShieldAlert } from 'lucide-react'
import type { Certificate } from './certificates-data'

interface CertificatePreviewProps {
  certificate: Certificate
}

/**
 * On-screen certificate, laid out like the downloadable PDF
 * (lib/certificates/pdf.ts): ink navy frame, gold rules and corner diamonds
 * on cream, logo, recipient in deep gold, course title, seal, certificate ID
 * and issue date. A landscape page (1.414:1) whose text scales with its
 * width (container units), so it reads the same on a phone and a desktop.
 * Stays "paper" in dark mode on purpose — it is a document.
 */
export function CertificatePreview({ certificate }: CertificatePreviewProps) {
  const fs = (cqw: number) => ({ fontSize: `${cqw}cqw` })
  return (
    <div className="@container w-full" role="img" aria-label={`Certificate of completion for ${certificate.member}, course ${certificate.course}`}>
      <div className="relative aspect-[1.414/1] w-full overflow-hidden bg-[#fbf7ee] shadow-lg" style={{ border: '1.2cqw solid #1a1a2e' }}>
        <div className="absolute inset-[1.6cqw] border-[0.25cqw] border-[#d4a843]" />
        <div className="absolute inset-[2.3cqw] border border-[#d4a843]/70" />
        {/* Gold diamonds on the inner frame's corners. */}
        {[{ left: '2.3cqw', top: '2.3cqw' }, { right: '2.3cqw', top: '2.3cqw' }, { left: '2.3cqw', bottom: '2.3cqw' }, { right: '2.3cqw', bottom: '2.3cqw' }].map((pos, i) => (
          <span key={i} className="absolute size-[1.6cqw] bg-[#d4a843]" style={{ ...pos, transform: `translate(${'left' in pos ? '-50%' : '50%'}, ${'top' in pos ? '-50%' : '50%'}) rotate(45deg)` }} aria-hidden />
        ))}

        <div className="relative flex h-full flex-col items-center px-[8cqw] pt-[5cqw] text-center">
          <div className="relative h-[7.5cqw] w-[11cqw]">
            <Image src="/kls-logo.jpg" alt="" fill sizes="120px" className="object-contain" />
          </div>
          <p className="mt-[1.2cqw] font-sans font-bold tracking-[0.5em] text-[#a07830]" style={fs(1.25)}>KINGDOM LIBRARY</p>
          <h2 className="mt-[0.8cqw] font-serif font-bold leading-none text-[#1a1a2e]" style={fs(4.6)}>Certificate of Completion</h2>
          <div className="mt-[1.6cqw] flex items-center gap-[1cqw]" aria-hidden>
            <span className="h-px w-[16cqw] bg-[#d4a843]" /><span className="size-[0.9cqw] rotate-45 bg-[#d4a843]" /><span className="h-px w-[16cqw] bg-[#d4a843]" />
          </div>

          <p className="mt-[2.4cqw] font-serif italic text-[#5c5548]" style={fs(1.8)}>This is to certify that</p>
          <p className="mt-[0.6cqw] max-w-full truncate border-b border-[#d4a843] px-[3cqw] pb-[0.6cqw] font-serif font-bold italic text-[#a07830]" style={fs(4.2)}>{certificate.member}</p>
          <p className="mt-[1.6cqw] font-serif italic text-[#5c5548]" style={fs(1.8)}>has successfully completed the course</p>
          <p className="mt-[0.8cqw] line-clamp-2 max-w-[80%] font-serif font-bold leading-tight text-[#1a1a2e]" style={fs(2.6)}>{certificate.course}</p>

          <div className="absolute inset-x-[6cqw] bottom-[5cqw] grid grid-cols-3 items-end">
            <div className="text-left">
              <p className="font-sans text-[#5c5548]" style={fs(1)}>Certificate ID</p>
              <p className="font-mono font-bold text-[#1a1a2e]" style={fs(1.4)}>{certificate.verificationCode}</p>
            </div>
            <div className="flex justify-center" aria-hidden>
              <div className="flex size-[9.5cqw] items-center justify-center rounded-full bg-[#d4a843] ring-[0.3cqw] ring-inset ring-[#fbf7ee]/80">
                <span className="font-sans font-bold leading-tight text-[#1a1a2e]" style={fs(1)}>KINGDOM<br />LIBRARY</span>
              </div>
            </div>
            <div className="text-right">
              <p className="inline-block min-w-[60%] border-b border-[#1a1a2e] pb-[0.3cqw] font-serif text-[#1a1a2e]" style={fs(1.6)}>{certificate.issuedAt}</p>
              <p className="mt-[0.3cqw] font-sans text-[#5c5548]" style={fs(1)}>Date of issue</p>
            </div>
          </div>
        </div>

        {certificate.revoked && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#fbf7ee]/40">
            <span className="flex -rotate-12 items-center gap-[1cqw] rounded border-[0.4cqw] border-red-600 px-[2cqw] py-[0.6cqw] font-sans font-bold tracking-widest text-red-600" style={fs(4)}>
              <ShieldAlert className="size-[4cqw]" /> REVOKED
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
