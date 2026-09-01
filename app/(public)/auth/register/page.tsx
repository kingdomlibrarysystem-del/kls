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
import { PasswordInput } from '@/components/ui/password-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { FormSection } from '@/components/ui/form-section'
import { GoogleSignInButton } from '@/components/ui/google-signin-button'
import { useLanguage } from '@/contexts/language-context'

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Registration failed')
      setSubmitSuccess(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <FormContainer maxWidth="md">
          <div className="text-center">
            <h2 className="font-cinzel text-2xl font-semibold text-w-950 mb-4">{t('auth.reg_success_title')}</h2>
            <p className="font-lato text-w-700 mb-6">{t('auth.reg_success_body')}</p>
            <Link href="/auth/login">
              <ElegantButton className="w-full">{t('auth.go_to_login')}</ElegantButton>
            </Link>
          </div>
        </FormContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <PageHeader title={t('auth.sign_up')} subtitle={t('auth.sign_up_subtitle')} className="text-center" />
        <FormContainer maxWidth="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{submitError}</div>
            )}
            <FormSection>
              <div>
                <FieldLabel htmlFor="fullName" required>{t('auth.full_name')}</FieldLabel>
                <FormInput
                  id="fullName"
                  type="text"
                  placeholder={t('auth.name_placeholder')}
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
              </div>
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
              <div>
                <FieldLabel htmlFor="password" required>{t('auth.password')}</FieldLabel>
                <PasswordInput
                  id="password"
                  placeholder={t('auth.password_placeholder')}
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>
            </FormSection>

            <ElegantButton type="submit" fullWidth loading={isSubmitting} variant="primary">
              {t('auth.sign_up')}
            </ElegantButton>

            <div className="flex items-center gap-3 text-xs text-w-500">
              <span className="flex-1 h-px bg-w-300" />
              {t('common.or')}
              <span className="flex-1 h-px bg-w-300" />
            </div>

            <GoogleSignInButton />

            <p className="text-center font-lato text-sm text-w-700">
              {t('auth.have_account')}{' '}
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
