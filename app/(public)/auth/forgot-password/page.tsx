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
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const { forgotPassword } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      await forgotPassword(data.email)
      setSubmitSuccess(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to process request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <FormContainer maxWidth="md">
          <div className="text-center">
            <h2 className="font-cinzel text-2xl font-semibold text-w-950 mb-4">{t('auth.check_email_title')}</h2>
            <p className="font-lato text-w-700 mb-6">{t('auth.check_email_body')}</p>
            <Link href="/auth/login">
              <ElegantButton className="w-full">{t('auth.back_to_signin')}</ElegantButton>
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
          <PageHeader title={t('auth.reset_password')} subtitle={t('auth.reset_subtitle')} />
        </div>
        <FormContainer maxWidth="md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{submitError}</div>
            )}
            <div>
              <FieldLabel htmlFor="email" required>{t('auth.email')}</FieldLabel>
              <FormInput
                id="email"
                type="email"
                placeholder={t('auth.email_placeholder')}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <ElegantButton type="submit" fullWidth loading={isSubmitting} variant="primary">
              {t('auth.send_reset')}
            </ElegantButton>
            <p className="text-center font-lato text-sm text-w-700">
              {t('auth.remember_password')}{' '}
              <Link href="/auth/login" className="text-w-600 hover:text-w-700 font-semibold underline">
                {t('auth.sign_in')}
              </Link>
            </p>
          </form>
        </FormContainer>
      </div>
    </div>
  )
}
