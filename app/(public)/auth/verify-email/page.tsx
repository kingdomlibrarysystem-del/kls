'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { FormContainer } from '@/components/ui/form-container'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { verifyEmail } = useAuth()
  const [verificationStatus, setVerificationStatus] = useState<
    'verifying' | 'success' | 'error'
  >('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const runVerification = async () => {
      if (!token) {
        setVerificationStatus('error')
        setErrorMessage('No verification token provided')
        return
      }

      try {
        await verifyEmail(token)
        setVerificationStatus('success')
      } catch (error) {
        setVerificationStatus('error')
        setErrorMessage(
          error instanceof Error ? error.message : 'Verification failed'
        )
      }
    }

    runVerification()
  }, [token, verifyEmail])

  if (verificationStatus === 'verifying') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <FormContainer maxWidth="md">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-w-300 border-t-w-600 rounded-full mx-auto mb-6"></div>
            <h2 className="font-cinzel text-2xl font-semibold text-w-950 mb-2">
              Verifying Email
            </h2>
            <p className="font-lato text-w-700">
              Please wait while we verify your email address...
            </p>
          </div>
        </FormContainer>
      </div>
    )
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <FormContainer maxWidth="md">
          <div className="text-center">
            <div className="text-5xl mb-4">✓</div>
            <h2 className="font-cinzel text-2xl font-semibold text-w-950 mb-2">
              Email Verified
            </h2>
            <p className="font-lato text-w-700 mb-6">
              Your email has been successfully verified. You can now sign in to
              your account.
            </p>
            <Link href="/auth/login">
              <ElegantButton className="w-full">Go to Sign In</ElegantButton>
            </Link>
          </div>
        </FormContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <FormContainer maxWidth="md">
        <div className="text-center">
          <h2 className="font-cinzel text-2xl font-semibold text-w-950 mb-2">
            Verification Failed
          </h2>
          <p className="font-lato text-red-600 mb-6">{errorMessage}</p>
          <Link href="/auth/login">
            <ElegantButton className="w-full">Back to Sign In</ElegantButton>
          </Link>
        </div>
      </FormContainer>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <FormContainer maxWidth="md">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-w-300 border-t-w-600 rounded-full mx-auto mb-6"></div>
            <h2 className="font-cinzel text-2xl font-semibold text-w-950 mb-2">
              Loading
            </h2>
          </div>
        </FormContainer>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
