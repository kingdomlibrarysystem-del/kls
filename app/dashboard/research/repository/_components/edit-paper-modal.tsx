'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { updatePaperInRepository } from './use-repository'
import { parseKeywords } from '../../submit/_components/paper-form-schema'
import type { ResearchPaper, PaperStatus } from './repository-data'

interface EditPaperModalProps {
  paper: ResearchPaper | null
  onClose: () => void
}

/** Edit modal for an existing ResearchPaper — no client-side transition-order enforcement, the API accepts any status value unconditionally. */
export function EditPaperModal({ paper, onClose }: EditPaperModalProps) {
  const [title, setTitle] = useState('')
  const [keywords, setKeywords] = useState('')
  const [status, setStatus] = useState<PaperStatus>('DRAFT')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (paper) {
      setTitle(paper.title)
      setKeywords(paper.keywords.join(', '))
      setStatus(paper.status)
      setError('')
    }
  }, [paper])

  if (!paper) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await updatePaperInRepository(paper.id, { title, keywords: parseKeywords(keywords), status })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save paper')
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => { if (!submitting) onClose() }

  return (
    <Modal open onClose={close} title="Edit Research Paper" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded font-lato text-sm"><AlertCircle size={15} /> {error}</div>}

        <div>
          <FieldLabel htmlFor="edit-paper-title" required>Title</FieldLabel>
          <FormInput id="edit-paper-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="edit-paper-keywords" required>Keywords (comma-separated)</FieldLabel>
            <FormInput id="edit-paper-keywords" type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="edit-paper-status" required>Status</FieldLabel>
            <select id="edit-paper-status" value={status} onChange={(e) => setStatus(e.target.value as PaperStatus)} className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none">
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={close}>Cancel</ElegantButton>
          <ElegantButton type="submit" loading={submitting} variant="primary">Save Changes</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
