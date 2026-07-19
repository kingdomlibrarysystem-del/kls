'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { FormSection } from '@/components/ui/form-section'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { systemSettingsSchema, defaultSystemSettings, type SystemSettingsFormData } from './settings-schema'

/**
 * System-wide borrowing/reservation policy form. Fully mocked: local state
 * only, simulates a short delay then shows an inline confirmation.
 */
export function SettingsForm() {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: defaultSystemSettings,
  })

  const onSubmit = async (data: SystemSettingsFormData) => {
    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      if (data.maxRenewals < 0) throw new Error('Max renewals cannot be negative')
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 3500)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <FormSection title="Borrowing & Reservation Policy">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {submitSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4 font-lato text-sm">
              <CheckCircle2 size={15} /> Settings saved.
            </div>
          )}
          {submitError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 font-lato text-sm">
              <AlertCircle size={15} /> {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="defaultBorrowPeriodDays" required>Default Borrow Period (days)</FieldLabel>
              <FormInput
                id="defaultBorrowPeriodDays"
                type="number"
                min={1}
                max={90}
                error={errors.defaultBorrowPeriodDays?.message}
                {...register('defaultBorrowPeriodDays', { valueAsNumber: true })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="maxRenewals" required>Max Renewals</FieldLabel>
              <FormInput
                id="maxRenewals"
                type="number"
                min={0}
                max={10}
                error={errors.maxRenewals?.message}
                {...register('maxRenewals', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="reservationClaimWindowHours" required>Reservation Claim Window (hours)</FieldLabel>
              <FormInput
                id="reservationClaimWindowHours"
                type="number"
                min={1}
                max={168}
                error={errors.reservationClaimWindowHours?.message}
                {...register('reservationClaimWindowHours', { valueAsNumber: true })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="maxConcurrentBorrows" required>Max Concurrent Borrows per Member</FieldLabel>
              <FormInput
                id="maxConcurrentBorrows"
                type="number"
                min={1}
                max={20}
                error={errors.maxConcurrentBorrows?.message}
                {...register('maxConcurrentBorrows', { valueAsNumber: true })}
              />
            </div>
          </div>

          <ElegantButton type="submit" loading={submitting} variant="primary">
            Save Settings
          </ElegantButton>
        </form>
      </FormSection>
    </div>
  )
}
