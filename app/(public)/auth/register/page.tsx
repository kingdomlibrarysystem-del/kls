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
import { FormSection } from '@/components/ui/form-section'
import { useAuth } from '@/contexts/auth-context'

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const { register: registerUser } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      await registerUser(data.fullName, data.email, data.password)
      setSubmitSuccess(true)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Registration failed'
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
              Registration Successful
            </h2>
            <p className="font-lato text-w-700 mb-6">
              Please check your email to verify your account before logging in.
            </p>
            <Link href="/auth/login">
              <ElegantButton className="w-full">
                Go to Login
              </ElegantButton>
            </Link>
          </div>
        </FormContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen  bg-white py-12 px-4  ">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Create Account"
          subtitle="Join Kingdom Library System"
          className="text-center"
        />

        <FormContainer maxWidth="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {submitError}
              </div>
            )}

            <div className="">
              <FormSection>
                <div>
                  <FieldLabel htmlFor="fullName" required>
                    Full Name
                  </FieldLabel>
                  <FormInput
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    error={errors.fullName?.message}
                    {...register("fullName")}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="email" required>
                    Email Address
                  </FieldLabel>
                  <FormInput
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="password" required>
                    Password
                  </FieldLabel>
                  <FormInput
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                </div>
              </FormSection>
            </div>

            <ElegantButton
              type="submit"
              fullWidth
              loading={isSubmitting}
              variant="primary"
            >
              Create Account
            </ElegantButton>

            <p className="text-center font-lato text-sm text-w-700">
              Already have an account?{" "}
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
  );
}
