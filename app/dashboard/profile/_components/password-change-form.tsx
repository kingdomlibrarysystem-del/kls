'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormSection } from '@/components/ui/form-section'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

/** "Change Password" form, extracted verbatim from the original page.tsx (no behavior changes). */
export function PasswordChangeForm() {
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordSubmitting(true)
    try {
      setPasswordSuccess(true)
      passwordForm.reset()
      setTimeout(() => setPasswordSuccess(false), 3000)
    } finally {
      setPasswordSubmitting(false)
    }
  }

  return (
    <FormSection title="Change Password">
      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
        {passwordSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            Password changed successfully
          </div>
        )}

        <div>
          <FieldLabel htmlFor="currentPassword" required>
            Current Password
          </FieldLabel>
          <FormInput
            id="currentPassword"
            type="password"
            placeholder="••••••••"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register('currentPassword')}
          />
        </div>

        <div>
          <FieldLabel htmlFor="newPassword" required>
            New Password
          </FieldLabel>
          <FormInput
            id="newPassword"
            type="password"
            placeholder="••••••••"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register('newPassword')}
          />
        </div>

        <div>
          <FieldLabel htmlFor="confirmPassword" required>
            Confirm Password
          </FieldLabel>
          <FormInput
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register('confirmPassword')}
          />
        </div>

        <ElegantButton
          type="submit"
          loading={passwordSubmitting}
          variant="primary"
        >
          Change Password
        </ElegantButton>
      </form>
    </FormSection>
  )
}
