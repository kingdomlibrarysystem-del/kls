'use client'

import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'

const editProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
})

type EditProfileFormData = z.infer<typeof editProfileSchema>

interface EditProfileModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Edit-profile modal for the member persona — name and email are the only
 * fields `AuthContext.User` actually has (no phone/address/avatar upload
 * field exists on the type), so those are the only fields this form
 * touches; the phone/location shown on the profile card below are static
 * placeholder copy, not part of the real user object. Genuinely calls
 * `updateUser()`, so a saved edit is immediately reflected in the profile
 * card that reads `user?.firstName`/`user?.email` — matches the admin
 * side's `ProfileInfoForm`, which does the same via the same `updateUser()`.
 */
export function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { user, updateUser } = useAuth()
  const { t } = useLanguage()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<EditProfileFormData>({ resolver: zodResolver(editProfileSchema) })

  useEffect(() => {
    if (open && user) {
      reset({ firstName: user.firstName, lastName: user.lastName, email: user.email })
    }
  }, [open, user, reset])

  const onSubmit = (data: EditProfileFormData) => {
    updateUser(data)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t("m_profile.edit_profile")} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isSubmitSuccessful && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--green-dim)', color: 'var(--green-light)', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
            <CheckCircle2 size={15} /> {t("m_profile.profile_updated")}
          </div>
        )}

        <div>
          <FieldLabel htmlFor="edit-profile-first-name" required>{t("m_profile.first_name")}</FieldLabel>
          <FormInput id="edit-profile-first-name" type="text" error={errors.firstName?.message} {...register('firstName')} />
        </div>

        <div>
          <FieldLabel htmlFor="edit-profile-last-name" required>{t("m_profile.last_name")}</FieldLabel>
          <FormInput id="edit-profile-last-name" type="text" error={errors.lastName?.message} {...register('lastName')} />
        </div>

        <div>
          <FieldLabel htmlFor="edit-profile-email" required>{t("m_profile.email")}</FieldLabel>
          <FormInput id="edit-profile-email" type="email" error={errors.email?.message} {...register('email')} />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <ElegantButton type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</ElegantButton>
          <ElegantButton type="submit" variant="primary">{t("common.save_changes")}</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
