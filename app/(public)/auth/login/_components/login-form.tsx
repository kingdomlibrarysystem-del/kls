'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSession } from 'next-auth/react'
import { FormContainer } from '@/components/ui/form-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { PasswordInput } from '@/components/ui/password-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { GoogleSignInButton } from '@/components/ui/google-signin-button'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { roleNameToUserRole } from '@/lib/roles'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [requiresTotp, setRequiresTotp] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [pendingCredentials, setPendingCredentials] = useState<LoginFormData | null>(null)
  const { login, checkRequiresTotp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const explicitRedirect = searchParams.get('redirect')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const attemptLogin = async (data: LoginFormData, totp?: string) => {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const { matched } = await login(data.email, data.password, totp)
      setIsSubmitting(false)
      if (!matched) {
        setSubmitError(requiresTotp
          ? 'That authenticator code is incorrect or has expired. Try the current code from your app.'
          : 'Incorrect email or password. Please try again.')
        return
      }
      if (explicitRedirect) { router.push(explicitRedirect); return }
      const freshSession = await getSession()
      const role = roleNameToUserRole(freshSession?.user?.roleName ?? '')
      router.push(role === 'admin' || role === 'manager' || role === 'staff' ? '/dashboard' : '/member')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Login failed')
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setSubmitError('')
    const needsTotp = await checkRequiresTotp(data.email)
    setIsSubmitting(false)
    if (needsTotp) { setRequiresTotp(true); setPendingCredentials(data); return }
    await attemptLogin(data)
  }

  const onSubmitTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pendingCredentials) await attemptLogin(pendingCredentials, totpCode)
  }

  if (requiresTotp) {
    return (
      <FormContainer maxWidth="md">
        <form onSubmit={onSubmitTotp} className="space-y-6">
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{submitError}</div>
          )}
          <div>
            <FieldLabel htmlFor="totpCode" required>{t('auth.totp_label')}</FieldLabel>
            <FormInput
              id="totpCode"
              type="text"
              inputMode="numeric"
              autoFocus
              placeholder={t('auth.totp_placeholder')}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
            />
            <p className="mt-2 text-sm text-w-600">{t('auth.totp_hint')}</p>
          </div>
          <ElegantButton type="submit" fullWidth loading={isSubmitting} variant="primary" disabled={!totpCode.trim()}>
            {t('auth.verify_signin')}
          </ElegantButton>
          <button
            type="button"
            onClick={() => { setRequiresTotp(false); setPendingCredentials(null); setTotpCode(''); setSubmitError('') }}
            className="w-full text-center font-lato text-sm text-w-700 underline"
          >
            {t('auth.back_to_form')}
          </button>
        </form>
      </FormContainer>
    )
  }

  return (
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
        <div>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel htmlFor="password" required>{t('auth.password')}</FieldLabel>
            <Link href="/auth/forgot-password" className="text-sm text-w-600 hover:text-w-700 font-semibold">
              {t('auth.forgot')}
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder={t('auth.password_placeholder')}
            error={errors.password?.message}
            {...register('password')}
          />
        </div>
        <ElegantButton type="submit" fullWidth loading={isSubmitting} variant="primary">
          {t('auth.sign_in')}
        </ElegantButton>
        <div className="flex items-center gap-3 text-xs text-w-500">
          <span className="flex-1 h-px bg-w-300" />
          {t('common.or')}
          <span className="flex-1 h-px bg-w-300" />
        </div>
        <GoogleSignInButton callbackUrl={explicitRedirect ?? undefined} />
        <p className="text-center font-lato text-sm text-w-700">
          {t('auth.no_account')}{' '}
          <Link href="/auth/register" className="text-w-600 hover:text-w-700 font-semibold underline">
            {t('auth.create_one')}
          </Link>
        </p>
      </form>
    </FormContainer>
  )
}
