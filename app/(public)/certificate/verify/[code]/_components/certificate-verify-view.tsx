'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Award } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { mockCertificates } from '@/app/dashboard/e-learning/certificates/_components/certificates-data'

/** Simulated network delay before the mock lookup result becomes visible. */
const LOAD_DELAY_MS = 400

interface CertificateVerifyViewProps {
  code: string
}

/**
 * Public certificate verification — no login required, per APP_DOC Task
 * 6.7. Looks up the code from the URL against the mock certificate array
 * only; shows a valid or invalid state.
 */
export function CertificateVerifyView({ code }: CertificateVerifyViewProps) {
  const [loading, setLoading] = useState(true)

  const certificate = mockCertificates.find((c) => c.verificationCode.toUpperCase() === code.toUpperCase())

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="max-w-md mx-auto text-center" aria-label="Verifying certificate">
        <Skeleton className="h-10 w-10 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-2/3 mx-auto mb-2 rounded" />
        <Skeleton className="h-4 w-1/2 mx-auto rounded" />
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="max-w-md mx-auto text-center">
        <XCircle size={40} className="mx-auto text-red-500 mb-4" />
        <h1 className="font-cinzel text-xl font-semibold text-w-950 mb-2">Certificate Not Found</h1>
        <p className="font-lato text-sm text-w-700 mb-1">
          No certificate matches the code:
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
