'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormSection } from '@/components/ui/form-section'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  organization: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

/** "Profile Information" form, extracted verbatim from the original page.tsx (no behavior changes). */
export function ProfileInfoForm() {
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 000-0000',
      organization: 'University of Kingdom',
    },
  })

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileSubmitting(true)
    try {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
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
  )
}
