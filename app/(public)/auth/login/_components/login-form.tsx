'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormContainer } from '@/components/ui/form-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

/**
 * Login form. On success, redirects to `?redirect=` if present (e.g. a
 * public library page the visitor was sent here from), or /member by
 * default — so a Borrow/Reserve attempt made while signed out can land
 * back on the same book after signing in.
 */
export function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/member'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const { matched } = await login(data.email, data.password)
      setIsSubmitting(false)
      if (!matched) {
        setSubmitError('Incorrect email or password. Please try again.')
        return
      }
      router.push(redirectTo)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Login failed')
      setIsSubmitting(false)
    }
  }

  return (
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

        <div>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel htmlFor="password" required>
              Password
            </FieldLabel>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-w-600 hover:text-w-700 font-semibold"
            >
              Forgot?
            </Link>
          </div>
          <FormInput
            id="password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <ElegantButton
          type="submit"
          fullWidth
          loading={isSubmitting}
          variant="primary"
        >
          Sign In
        </ElegantButton>

        <p className="text-center font-lato text-sm text-w-700">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/register"
            className="text-w-600 hover:text-w-700 font-semibold underline"
          >
            Create one
          </Link>
        </p>
      </form>
    </FormContainer>
  )
}
