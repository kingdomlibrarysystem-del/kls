'use client'

import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { LoginForm } from './_components/login-form'
import { useLanguage } from '@/contexts/language-context'

export default function LoginPage() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="w-full">
        <div className="max-w-md mx-auto mb-8">
          <PageHeader
            title={t('auth.sign_in')}
            subtitle={t('auth.sign_in_subtitle')}
            className="text-center"
          />
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
