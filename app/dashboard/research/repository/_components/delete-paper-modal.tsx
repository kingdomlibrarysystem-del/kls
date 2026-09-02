'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { deletePaperFromRepository } from './use-repository'
import type { ResearchPaper } from './repository-data'

interface DeletePaperModalProps {
  paper: ResearchPaper | null
  onClose: () => void
}

/** Plain delete confirmation, mirrors delete-user-modal.tsx — ResearchPaper's DELETE has no guard, unlike Project's. */
export function DeletePaperModal({ paper, onClose }: DeletePaperModalProps) {
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  if (!paper) return null

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await deletePaperFromRepository(paper.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this paper')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Delete Research Paper" size="sm">
      <div>
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 mb-4">
          <AlertTriangle size={14} className="text-red-600 shrink-0" />
          <p className="font-lato text-xs text-red-700">This action cannot be undone.</p>
        </div>
        <p className="font-lato text-sm text-w-700 mb-4">
          Are you sure you want to delete <span className="font-semibold text-w-950">&ldquo;{paper.title}&rdquo;</span>?
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
