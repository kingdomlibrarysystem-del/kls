'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { deleteArticle } from '../../_shared/use-articles'
import type { NewsArticle } from '../../_shared/news-data'

interface DeleteArticleModalProps {
  article: NewsArticle | null
  onClose: () => void
}

/** Delete confirmation, mirrors delete-user-modal.tsx's shape. */
export function DeleteArticleModal({ article, onClose }: DeleteArticleModalProps) {
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  if (!article) return null

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteArticle(article.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this article')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Delete Article" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded font-lato text-sm">
          <AlertTriangle size={16} /> This cannot be undone.
        </div>
        <p className="font-lato text-sm text-w-700">Delete <span className="font-semibold text-w-950">&ldquo;{article.title}&rdquo;</span>?</p>
        {error && <p className="font-lato text-xs text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton type="button" variant="primary" loading={deleting} className="bg-red-600 border-red-700 hover:bg-red-700" onClick={handleDelete}>Delete</ElegantButton>
        </div>
      </div>
    </Modal>
  )
}
