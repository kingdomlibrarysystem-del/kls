'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Award } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface CertificateVerifyViewProps {
  code: string
}

interface VerifiedCertificate {
  member: string
  course: string
  issuedAt: string
  verificationCode: string
  revoked: boolean
}

/**
 * Public certificate verification — no login required, per APP_DOC Task
 * 6.7. Looks up the code from the URL against the real /api/certificates
 * (filtered server-side by verificationCode, so an unauthenticated visitor
 * never receives the full certificate list) and shows a valid or invalid
 * state.
 */
export function CertificateVerifyView({ code }: CertificateVerifyViewProps) {
  const [loading, setLoading] = useState(true)
  const [certificate, setCertificate] = useState<VerifiedCertificate | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/certificates?verificationCode=${encodeURIComponent(code.toUpperCase())}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        setCertificate(json.code === 'success' && json.data?.[0] ? json.data[0] : null)
      })
      .catch(() => {
        if (!cancelled) setCertificate(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [code])

  const isValid = !!certificate && !certificate.revoked

  if (loading) {
    return (
      <div className="max-w-md mx-auto text-center" aria-label="Verifying certificate">
        <Skeleton className="h-10 w-10 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-2/3 mx-auto mb-2 rounded" />
        <Skeleton className="h-4 w-1/2 mx-auto rounded" />
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="max-w-md mx-auto text-center">
        <XCircle size={40} className="mx-auto text-red-500 mb-4" />
        <h1 className="font-cinzel text-xl font-semibold text-w-950 mb-2">
          {certificate ? 'Certificate Revoked' : 'Certificate Not Found'}
        </h1>
        <p className="font-lato text-sm text-w-700 mb-1">
          {certificate ? 'This certificate is no longer valid:' : 'No certificate matches the code:'}
        </p>
        <p className="font-mono text-xs text-w-600 bg-w-100 inline-block px-2 py-1 rounded">{code}</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <CheckCircle2 size={40} className="mx-auto text-green-600 mb-4" />
      <h1 className="font-cinzel text-xl font-semibold text-w-950 mb-1">Certificate Verified</h1>
      <p className="font-lato text-sm text-w-700 mb-6">This certificate is valid and was issued by Kingdom Library.</p>

      <div className="bg-form-highlight border border-w-300 rounded-lg p-6 text-left">
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} className="text-w-600" />
          <span className="font-lato text-xs uppercase tracking-wider text-w-600 font-semibold">Certificate of Completion</span>
        </div>
        <dl className="space-y-2 font-lato text-sm">
          <div className="flex justify-between">
            <dt className="text-w-700">Recipient</dt>
            <dd className="font-semibold text-w-950">{certificate.member}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-w-700">Course</dt>
            <dd className="font-semibold text-w-950">{certificate.course}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-w-700">Issued</dt>
            <dd className="font-semibold text-w-950">{certificate.issuedAt}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-w-700">Code</dt>
            <dd className="font-mono text-xs text-w-600">{certificate.verificationCode}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
