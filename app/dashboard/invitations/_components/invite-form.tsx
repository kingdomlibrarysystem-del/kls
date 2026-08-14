'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { FormSection } from '@/components/ui/form-section'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { invitationSchema, invitableRoles, type InvitationFormData } from './invitation-schema'

interface InviteFormProps {
  /** Sends a real invitation via the parent's useInvitations() hook. */
  onInvite: (email: string, role: string) => Promise<unknown>
}

/** Invite-by-email form. On submit, creates a real PENDING invitation via a real POST /api/invitations. */
export function InviteForm({ onInvite }: InviteFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [sentTo, setSentTo] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { role: 'Staff' },
  })

  const onSubmit = async (data: InvitationFormData) => {
    setSubmitting(true)
    setSubmitError('')
    setSentTo('')
    try {
      await onInvite(data.email, data.role)
      setSentTo(data.email)
      reset({ email: '', role: 'Staff' })
      setTimeout(() => setSentTo(''), 3500)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormSection title="Invite a New User">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {sentTo && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4 font-lato text-sm">
            <CheckCircle2 size={15} /> Invitation sent to {sentTo}.
          </div>
        )}
        {submitError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 font-lato text-sm">
            <AlertCircle size={15} /> {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="email" required>Email Address</FieldLabel>
            <FormInput id="email" type="email" placeholder="name@kingdom.edu" error={errors.email?.message} {...register('email')} />
          </div>
          <div>
            <FieldLabel htmlFor="role" required>Role</FieldLabel>
            <select
              id="role"
              className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
              {...register('role')}
            >
              {invitableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <ElegantButton type="submit" loading={submitting} variant="primary">
          <Send size={14} className="inline-block mr-1" /> Send Invitation
        </ElegantButton>
      </form>
    </FormSection>
  )
}
