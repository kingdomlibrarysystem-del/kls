'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/ui/page-header'
import { FormSection } from '@/components/ui/form-section'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { SectionHeader } from '@/components/ui/section-header'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  organization: z.string().optional(),
})

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

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 000-0000',
      organization: 'University of Kingdom',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileSubmitting(true)
    try {
      // TODO: Call update profile API
      console.log('[v0] Profile update:', data)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } finally {
      setProfileSubmitting(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordSubmitting(true)
    try {
      // TODO: Call change password API
      console.log('[v0] Password change:', data)
      setPasswordSuccess(true)
      passwordForm.reset()
      setTimeout(() => setPasswordSuccess(false), 3000)
    } finally {
      setPasswordSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account information"
      />

      <div className="max-w-2xl">
        {/* Profile Information */}
        <FormSection title="Profile Information">
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            {profileSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                Profile updated successfully
              </div>
            )}

            <div>
              <FieldLabel htmlFor="fullName" required>
                Full Name
              </FieldLabel>
              <FormInput
                id="fullName"
                type="text"
                error={profileForm.formState.errors.fullName?.message}
                {...profileForm.register('fullName')}
              />
            </div>

            <div>
              <FieldLabel htmlFor="email" required>
                Email Address
              </FieldLabel>
              <FormInput
                id="email"
                type="email"
                error={profileForm.formState.errors.email?.message}
                {...profileForm.register('email')}
              />
            </div>

            <div>
              <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
              <FormInput
                id="phone"
                type="tel"
                error={profileForm.formState.errors.phone?.message}
                {...profileForm.register('phone')}
              />
            </div>

            <div>
              <FieldLabel htmlFor="organization">Organization</FieldLabel>
              <FormInput
                id="organization"
                type="text"
                error={profileForm.formState.errors.organization?.message}
                {...profileForm.register('organization')}
              />
            </div>

            <ElegantButton
              type="submit"
              loading={profileSubmitting}
              variant="primary"
            >
              Save Changes
            </ElegantButton>
          </form>
        </FormSection>

        {/* Change Password */}
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

        {/* Account Information */}
        <div className="bg-form-section border border-w-400 rounded-lg p-6 mt-6">
          <SectionHeader>Account Information</SectionHeader>
          <div className="space-y-4 font-lato text-sm text-w-700">
            <div className="flex justify-between">
              <span>Account Created:</span>
              <span className="font-semibold text-w-950">2024-01-15</span>
            </div>
            <div className="flex justify-between">
              <span>Account Status:</span>
              <span className="font-semibold text-green-700">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Email Verified:</span>
              <span className="font-semibold text-green-700">Yes</span>
            </div>
            <div className="border-t border-w-400 pt-4 mt-4">
              <p className="text-xs text-w-600 mb-3">
                For security concerns or to permanently delete your account,
                please contact our support team.
              </p>
              <ElegantButton variant="outline">Contact Support</ElegantButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
