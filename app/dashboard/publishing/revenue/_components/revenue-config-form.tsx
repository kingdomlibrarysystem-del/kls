'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, AlertCircle, Settings2 } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { revenueConfigSchema, type RevenueConfigFormData } from './revenue-config-schema'
import { setDefaultRevenueShare } from './use-revenue'

/**
 * Default revenue-share config panel: contributor % and platform % (must sum
 * to 100). Applies only to publications approved after this is saved — it
 * does not recompute existing rows, which may carry their own negotiated
 * splits.
 */
export function RevenueConfigForm() {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RevenueConfigFormData>({
    resolver: zodResolver(revenueConfigSchema),
    defaultValues: { contributorShare: 70, platformShare: 30 },
  })

  const onSubmit = async (data: RevenueConfigFormData) => {
    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      if (data.contributorShare + data.platformShare !== 100) throw new Error('Shares must add up to 100%')
      setDefaultRevenueShare(data)
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 3500)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save configuration')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-form-section border border-w-400 rounded-lg p-5 mt-6 max-w-md">
      <h3 className="flex items-center gap-1.5 font-cinzel text-sm font-semibold text-w-950 mb-1">
        <Settings2 size={14} className="text-w-600" /> Default Revenue Share
      </h3>
      <p className="font-lato text-xs text-w-600 mb-4">
        Applies to publications approved after saving — existing rows in the table above keep their own share.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {submitSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded mb-3 font-lato text-xs">
            <CheckCircle2 size={13} /> Default shares updated for future approvals.
          </div>
        )}
        {(submitError || errors.platformShare?.message) && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 font-lato text-xs">
            <AlertCircle size={13} /> {submitError || errors.platformShare?.message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="contributorShare" required>Contributor %</FieldLabel>
            <FormInput id="contributorShare" type="number" min={0} max={100} error={errors.contributorShare?.message} {...register('contributorShare', { valueAsNumber: true })} />
          </div>
          <div>
            <FieldLabel htmlFor="platformShare" required>Platform %</FieldLabel>
            <FormInput id="platformShare" type="number" min={0} max={100} {...register('platformShare', { valueAsNumber: true })} />
          </div>
        </div>

        <ElegantButton type="submit" loading={submitting} variant="primary" className="mt-2 text-sm py-2">
          Save Defaults
        </ElegantButton>
      </form>
    </div>
  )
}
