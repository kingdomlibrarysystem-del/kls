'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { FormContainer } from '@/components/ui/form-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      // TODO: Call forgot password API
      console.log('[v0] Forgot password request:', data)
      setSubmitSuccess(true)
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to process request'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <FormContainer maxWidth="md">
          <div className="text-center">
            <h2 className="font-cinzel text-2xl font-semibold text-w-950 mb-4">
              Check Your Email
            </h2>
            <p className="font-lato text-w-700 mb-6">
              If an account exists with that email, you&apos;ll receive a
              password reset link shortly.
            </p>
            <Link href="/auth/login">
              <ElegantButton className="w-full">Back to Sign In</ElegantButton>
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
          <PageHeader
            title="Reset Password"
            subtitle="Enter your email to receive a reset link"
          />
        </div>

        <FormContainer maxWidth="md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {submitError}
              </div>
            )}

            <div>
              <FieldLabel htmlFor="email" required>
                Email Address
              </FieldLabel>
              <FormInput
                id="email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <ElegantButton
              type="submit"
              fullWidth
              loading={isSubmitting}
              variant="primary"
            >
              Send Reset Link
            </ElegantButton>

            <p className="text-center font-lato text-sm text-w-700">
              Remember your password?{' '}
              <Link
                href="/auth/login"
                className="text-w-600 hover:text-w-700 font-semibold underline"
              >
                Sign In
              </Link>
            </p>
          </form>
        </FormContainer>
      </div>
    </div>
  )
}
