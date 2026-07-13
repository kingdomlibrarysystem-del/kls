import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { LoginForm } from './_components/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white py-8 px-4 ">
      <div className="w-full">
        <div className="max-w-md mx-auto mb-8">
          <PageHeader
            title="Welcome Back"
            subtitle="Sign in to your account"
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
