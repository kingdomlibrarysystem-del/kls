'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { useAuth } from '@/contexts/auth-context'
import { addCampaign, updateCampaign } from '../../_shared/use-campaigns'
import { campaignSchema, type CampaignFormData } from './campaign-form-schema'
import type { DonationCampaign } from '../../_shared/donations-data'

interface CampaignFormProps {
  open: boolean
  editing: DonationCampaign | null
  onClose: () => void
}

/** Create/edit modal for a DonationCampaign, mirrors ArticleFormModal's shape. */
export function CampaignForm({ open, editing, onClose }: CampaignFormProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { coverImage: '' },
  })
  const coverImage = watch('coverImage') ?? ''

  useEffect(() => {
    if (open) {
      reset(editing
        ? { title: editing.title, description: editing.description, category: editing.category, coverImage: editing.coverImage ?? '', goalRwf: editing.goalRwf }
        : { title: '', description: '', category: '', coverImage: '', goalRwf: undefined })
      setSubmitError('')
      setSubmitSuccess(false)
    }
  }, [open, editing, reset])

  const onSubmit = async (data: CampaignFormData) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      if (editing) {
        await updateCampaign(editing.id, data)
      } else {
        if (!user) throw new Error('You must be signed in to create a campaign')
        await addCampaign({ createdById: user.id, ...data, coverImage: data.coverImage || undefined })
      }
      setSubmitSuccess(true)
      setTimeout(onClose, 800)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save campaign')
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => { if (!submitting) onClose() }

  return (
    <Modal open={open} onClose={close} title={editing ? 'Edit Campaign' : 'New Campaign'} size="3xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitSuccess && <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm"><CheckCircle2 size={15} /> Campaign saved.</div>}
        {submitError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded font-lato text-sm"><AlertCircle size={15} /> {submitError}</div>}

        <div>
          <FieldLabel htmlFor="title" required>Title</FieldLabel>
          <FormInput id="title" type="text" error={errors.title?.message} {...register('title')} />
        </div>

        <div>
          <FieldLabel htmlFor="description" required>Description</FieldLabel>
          <textarea id="description" rows={4} className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none" {...register('description')} />
          {errors.description && <p className="text-red-600 text-xs mt-1 font-lato">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="category" required>Category</FieldLabel>
            <FormInput id="category" type="text" placeholder="e.g. Library Fund" error={errors.category?.message} {...register('category')} />
          </div>
          <div>
            <FieldLabel htmlFor="goalRwf" required>Goal (RWF)</FieldLabel>
            <FormInput id="goalRwf" type="number" min={1} error={errors.goalRwf?.message} {...register('goalRwf', { valueAsNumber: true })} />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="coverImage">Cover Image</FieldLabel>
          <CloudinaryUploadField id="coverImage" accept="image/*" label="Upload cover image" kind="image" value={coverImage} onUploaded={(result) => setValue('coverImage', result.url)} onClear={() => setValue('coverImage', '')} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={close}>Cancel</ElegantButton>
          <ElegantButton type="submit" loading={submitting} variant="primary">{editing ? 'Save Changes' : 'Create Campaign'}</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
