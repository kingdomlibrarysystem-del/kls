'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react'
import { FormSection } from '@/components/ui/form-section'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { paperSchema, parseKeywords, type PaperFormData } from './paper-form-schema'
import { addPaperToRepository } from '../../repository/_components/use-repository'
import { useResearchProjects } from '../../_shared/use-research-projects'

/**
 * Author attributed to papers submitted from this form — the same
 * recurring contributor persona used across research/publishing mock
 * data. This is an admin tool submitting on a known contributor's
 * behalf (not a "who is currently logged in" question), so resolving
 * this name to a real contributorId does not hit the same identity
 * blocker as a live member-facing write.
 */
const SUBMITTING_AUTHOR = 'Pastor Emmanuel Rugamba'

/**
 * Submit Paper form. On submit, splits the comma-separated keywords into a
 * tag list and posts the new paper (status SUBMITTED) to the real
 * ResearchPaper collection, so it's immediately visible in the Paper
 * Repository.
 */
export function PaperFormView() {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submittedKeywords, setSubmittedKeywords] = useState<string[] | null>(null)
  const { data: projects } = useResearchProjects()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaperFormData>({
    resolver: zodResolver(paperSchema),
    defaultValues: { projectId: '' },
  })

  const onSubmit = async (data: PaperFormData) => {
    setSubmitting(true)
    setSubmitError('')
    setSubmittedKeywords(null)
    try {
      const keywords = parseKeywords(data.keywords)
      if (keywords.length === 0) throw new Error('Enter at least one valid keyword')
      const authorId = projects.flatMap((p) => p.contributors).find((c) => c.name === SUBMITTING_AUTHOR)?.id
      if (!authorId) throw new Error(`Could not resolve ${SUBMITTING_AUTHOR} to a real contributor record`)
      await addPaperToRepository({
        title: data.title,
        abstract: data.abstract,
        authorId,
        projectId: data.projectId,
        keywords,
      })
      setSubmittedKeywords(keywords)
      reset({ title: '', abstract: '', keywords: '', projectId: '' })
      setTimeout(() => setSubmittedKeywords(null), 4000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit paper')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <FormSection title="Paper Details">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {submittedKeywords && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4 font-lato text-sm">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              <span>Paper submitted for review and added to the repository. Keywords: {submittedKeywords.join(', ')}</span>
            </div>
          )}
          {submitError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 font-lato text-sm">
              <AlertCircle size={15} /> {submitError}
            </div>
          )}

          <div>
            <FieldLabel htmlFor="title" required>Paper Title</FieldLabel>
            <FormInput id="title" type="text" placeholder="e.g. Faith and Resilience in Rural Communities" error={errors.title?.message} {...register('title')} />
          </div>

          <div>
            <FieldLabel htmlFor="abstract" required>Abstract</FieldLabel>
            <textarea
              id="abstract"
              rows={5}
              placeholder="Summarize the paper's purpose, method, and findings…"
              className={`w-full px-4 py-3 font-lato text-sm border rounded transition-colors focus:outline-none ${
                errors.abstract ? 'border-red-500 bg-red-50' : 'border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600'
              }`}
              {...register('abstract')}
            />
            {errors.abstract && <p className="text-red-600 text-xs mt-1 font-lato">{errors.abstract.message}</p>}
          </div>

          <div>
            <FieldLabel htmlFor="keywords" required>Keywords</FieldLabel>
            <FormInput
              id="keywords"
              type="text"
              placeholder="e.g. discipleship, technology, rural ministry"
              error={errors.keywords?.message}
              {...register('keywords')}
            />
            <p className="mt-1 font-lato text-xs text-w-500">Comma-separated — split into tags on submit.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="projectId" required>Linked Project</FieldLabel>
              <select
                id="projectId"
                className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
                {...register('projectId')}
              >
                <option value="">Select project…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              {errors.projectId && <p className="text-red-600 text-xs mt-1 font-lato">{errors.projectId.message}</p>}
            </div>

            <div>
              <FieldLabel htmlFor="paperFile">Manuscript File</FieldLabel>
              <label
                htmlFor="paperFile"
                className="flex items-center gap-2 px-4 py-3 font-lato text-sm border border-dashed border-w-400 bg-form-bg rounded cursor-pointer text-w-700 hover:border-w-600 transition-colors"
              >
                <UploadCloud size={16} /> Choose file…
                <input id="paperFile" type="file" accept=".pdf,.doc,.docx" className="hidden" aria-label="Upload manuscript file" />
              </label>
            </div>
          </div>

          <ElegantButton type="submit" loading={submitting} variant="primary">
            Submit Paper
          </ElegantButton>
        </form>
      </FormSection>
    </div>
  )
}
