'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormSection } from '@/components/ui/form-section'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'

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

/** "Change Password" form — verifies the current password server-side and sets a real bcrypt-hashed new one via POST /api/auth/change-password. */
export function PasswordChangeForm() {
  const { user } = useAuth()
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!user) return
    setPasswordSubmitting(true)
    setPasswordError('')
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword: data.currentPassword, newPassword: data.newPassword }),
      })
      const json = await res.json()
      if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to change password')
      setPasswordSuccess(true)
      passwordForm.reset()
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password')
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
        {passwordError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {passwordError}
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
