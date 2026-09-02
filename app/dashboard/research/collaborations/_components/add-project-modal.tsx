'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useUsers } from '@/app/dashboard/users/_components/use-users'
import { addResearchProject } from '../../_shared/use-research-projects'
import { projectSchema, type ProjectFormData } from './project-form-schema'

interface AddProjectModalProps {
  open: boolean
  onClose: () => void
}

/** Add Research Project, mirrors AddCourseModal's exact shape — the create-UI gap this project's own API has long supported but no form ever called. */
export function AddProjectModal({ open, onClose }: AddProjectModalProps) {
  const { users } = useUsers()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { status: 'ACTIVE' },
  })

  useEffect(() => {
    if (open) {
      reset({ title: '', description: '', status: 'ACTIVE', startDate: new Date().toISOString().split('T')[0], contributorIds: [] })
      setSubmitError('')
      setSubmitSuccess(false)
    }
  }, [open, reset])

  const onSubmit = async (data: ProjectFormData) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      await addResearchProject(data)
      setSubmitSuccess(true)
      setTimeout(onClose, 800)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save project')
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => { if (!submitting) onClose() }

  return (
    <Modal open={open} onClose={close} title="Add Research Project" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitSuccess && <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm"><CheckCircle2 size={15} /> Project created.</div>}
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
            <FieldLabel htmlFor="status" required>Status</FieldLabel>
            <select id="status" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="startDate" required>Start Date</FieldLabel>
            <FormInput id="startDate" type="date" error={errors.startDate?.message} {...register('startDate')} />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="contributorIds">Contributors</FieldLabel>
          <select id="contributorIds" multiple size={5} className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('contributorIds')}>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <p className="font-lato text-xs text-w-600 mt-1">Ctrl/Cmd-click to select multiple.</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={close}>Cancel</ElegantButton>
          <ElegantButton type="submit" loading={submitting} variant="primary">Add Project</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
