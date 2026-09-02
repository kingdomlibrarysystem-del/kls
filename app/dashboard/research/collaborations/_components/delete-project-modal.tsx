'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { deleteResearchProject } from '../../_shared/use-research-projects'
import type { ResearchProjectSummary } from './collaborations-data'

interface DeleteProjectModalProps {
  project: ResearchProjectSummary | null
  onClose: () => void
}

/**
 * Delete confirmation, mirrors delete-user-modal.tsx's shape but keeps
 * the modal open and shows the real server error inline on failure
 * (e.g. the 409 "still has papers" guard) instead of swallowing it —
 * that message is actionable information the admin needs immediately.
 */
export function DeleteProjectModal({ project, onClose }: DeleteProjectModalProps) {
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  if (!project) return null

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteResearchProject(project.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this project')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Delete Research Project" size="sm">
      <div>
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 mb-4">
          <AlertTriangle size={14} className="text-red-600 shrink-0" />
          <p className="font-lato text-xs text-red-700">This action cannot be undone.</p>
        </div>
        <p className="font-lato text-sm text-w-700 mb-4">
          Are you sure you want to delete <span className="font-semibold text-w-950">&ldquo;{project.title}&rdquo;</span>?
        </p>
        {error && <p className="font-lato text-xs text-red-700 mb-4">{error}</p>}
        <div className="flex gap-2">
          <ElegantButton variant="primary" loading={deleting} onClick={handleDelete} className="flex-1 text-sm py-2 bg-red-600 border-red-700 hover:bg-red-700">Delete</ElegantButton>
          <ElegantButton variant="outline" onClick={onClose} className="flex-1 text-sm py-2">Cancel</ElegantButton>
        </div>
      </div>
    </Modal>
  )
}
