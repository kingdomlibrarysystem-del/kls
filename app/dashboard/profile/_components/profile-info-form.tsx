'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormSection } from '@/components/ui/form-section'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

type ProfileFormData = z.infer<typeof profileSchema>

/** "Profile Information" form — pre-filled from the real signed-in user, saves via a real PATCH /api/users/[id] (contexts/auth-context.tsx's updateUser). Phone/organization were dropped: the real User model has no such fields, and fabricating a save for them would be dishonest. */
export function ProfileInfoForm() {
  const { user, updateUser } = useAuth()
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', email: '' },
  })

  useEffect(() => {
    if (user) {
      profileForm.reset({ fullName: `${user.firstName} ${user.lastName}`.trim(), email: user.email })
    }
  }, [user, profileForm])

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileSubmitting(true)
    setProfileError('')
    try {
      const [firstName, ...rest] = data.fullName.trim().split(/\s+/)
      updateUser({ firstName: firstName || data.fullName, lastName: rest.join(' '), email: data.email })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setProfileSubmitting(false)
    }
  }

  return (
    <FormSection title="Profile Information">
      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
        {profileSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            Profile updated successfully
          </div>
        )}
        {profileError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {profileError}
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

        <ElegantButton
          type="submit"
          loading={profileSubmitting}
          variant="primary"
        >
          Save Changes
        </ElegantButton>
      </form>
    </FormSection>
  )
}
