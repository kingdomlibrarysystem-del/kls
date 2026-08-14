'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { FormContainer } from '@/components/ui/form-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token || !email) {
      setSubmitError('This reset link is missing required information')
      return
    }
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password: data.password }),
      })
      const json = await res.json()
      if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to reset password')
      setSubmitSuccess(true)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <FormContainer maxWidth="md">
          <div className="text-center">
            <h2 className="font-cinzel text-2xl font-semibold text-w-950 mb-4">Password Reset</h2>
            <p className="font-lato text-w-700 mb-6">Your password has been updated. Redirecting you to sign in…</p>
          </div>
        </FormContainer>
      </div>
    )
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <FormContainer maxWidth="md">
          <div className="text-center">
            <h2 className="font-cinzel text-2xl font-semibold text-w-950 mb-4">Invalid Link</h2>
            <p className="font-lato text-red-600 mb-6">This reset link is missing required information.</p>
            <Link href="/auth/forgot-password">
              <ElegantButton className="w-full">Request a New Link</ElegantButton>
            </Link>
          </div>
        </FormContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 flex items-center">
      <div className="w-full">
        <div className="max-w-md mx-auto mb-8">
          <PageHeader title="Reset Password" subtitle="Choose a new password for your account" />
        </div>

        <FormContainer maxWidth="md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{submitError}</div>
            )}

            <div>
              <FieldLabel htmlFor="password" required>New Password</FieldLabel>
              <FormInput id="password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            </div>

            <ElegantButton type="submit" fullWidth loading={isSubmitting} variant="primary">
              Reset Password
            </ElegantButton>
          </form>
        </FormContainer>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
