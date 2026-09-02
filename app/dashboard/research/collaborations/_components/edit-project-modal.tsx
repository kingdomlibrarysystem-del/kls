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
import { updateResearchProject } from '../../_shared/use-research-projects'
import { projectSchema, type ProjectFormData } from './project-form-schema'
import type { ResearchProjectSummary } from './collaborations-data'

interface EditProjectModalProps {
  project: ResearchProjectSummary | null
  onClose: () => void
}

/** Edit modal for an existing ResearchProject, mirrors EditCourseModal's shape. */
export function EditProjectModal({ project, onClose }: EditProjectModalProps) {
  const { users } = useUsers()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) })

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        contributorIds: project.contributors.map((c) => c.id),
      })
      setSubmitError('')
    }
  }, [project, reset])

  if (!project) return null

  const onSubmit = async (data: ProjectFormData) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      await updateResearchProject(project.id, data)
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save project')
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => { if (!submitting) onClose() }

  return (
    <Modal open onClose={close} title="Edit Research Project" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded font-lato text-sm"><AlertCircle size={15} /> {submitError}</div>}

        <div>
          <FieldLabel htmlFor="edit-title" required>Title</FieldLabel>
          <FormInput id="edit-title" type="text" error={errors.title?.message} {...register('title')} />
        </div>

        <div>
          <FieldLabel htmlFor="edit-description" required>Description</FieldLabel>
          <textarea id="edit-description" rows={4} className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none" {...register('description')} />
          {errors.description && <p className="text-red-600 text-xs mt-1 font-lato">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="edit-status" required>Status</FieldLabel>
            <select id="edit-status" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="edit-startDate" required>Start Date</FieldLabel>
            <FormInput id="edit-startDate" type="date" error={errors.startDate?.message} {...register('startDate')} />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="edit-contributorIds">Contributors</FieldLabel>
          <select id="edit-contributorIds" multiple size={5} className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('contributorIds')}>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <p className="font-lato text-xs text-w-600 mt-1">Ctrl/Cmd-click to select multiple — replaces the full contributor list.</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={close}>Cancel</ElegantButton>
          <ElegantButton type="submit" loading={submitting} variant="primary">Save Changes</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
