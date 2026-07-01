'use client'

import { useState } from 'react'
import { Search, CheckCircle2, XCircle } from 'lucide-react'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { mockCertificates, type Certificate } from './certificates-data'

type LookupResult = { status: 'idle' } | { status: 'found'; certificate: Certificate } | { status: 'not-found' }

/**
 * Mock "verify by code" panel — looks up a verification code against the
 * local certificate array only, no network call.
 */
export function VerifyByCode() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<LookupResult>({ status: 'idle' })
  const [error, setError] = useState('')

  const handleVerify = () => {
    setError('')
    try {
      const trimmed = code.trim().toUpperCase()
      if (!trimmed) throw new Error('Enter a verification code')
      const match = mockCertificates.find((c) => c.verificationCode.toUpperCase() === trimmed)
      setResult(match ? { status: 'found', certificate: match } : { status: 'not-found' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
    }
  }

  return (
    <div className="bg-form-section border border-w-400 rounded-lg p-5 mb-6">
      <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-3">Verify Certificate by Code</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <FormInput
            type="text"
            placeholder="e.g. KLS-7F3A-91BC"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={error || undefined}
            aria-label="Verification code"
          />
        </div>
        <ElegantButton type="button" variant="primary" onClick={handleVerify} className="sm:w-auto">
          <Search size={14} className="inline-block mr-1" /> Verify
        </ElegantButton>
      </div>

      {result.status === 'found' && (
        <div className="flex items-start gap-2 mt-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          <span>
            Valid certificate — <strong>{result.certificate.member}</strong> completed{' '}
            <strong>{result.certificate.course}</strong> on {result.certificate.issuedAt}.
          </span>
        </div>
      )}
      {result.status === 'not-found' && (
        <div className="flex items-center gap-2 mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded font-lato text-sm">
          <XCircle size={15} /> No certificate found for that code.
        </div>
      )}
    </div>
  )
}
