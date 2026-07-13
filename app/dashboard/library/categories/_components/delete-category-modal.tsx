import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { Category } from './categories-data'

interface DeleteCategoryModalProps {
  category: Category | null
  onClose: () => void
  onConfirm: () => void
}

/** Delete confirmation modal, extracted verbatim from the original page.tsx (no behavior changes). */
export function DeleteCategoryModal({ category, onClose, onConfirm }: DeleteCategoryModalProps) {
  return (
    <Modal open={!!category} onClose={onClose} title="Delete Category" size="sm">
      {category && (
        <div>
          <p className="font-lato text-sm text-w-700 dark:text-white/70 mb-2">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-w-950 dark:text-white">&ldquo;{category.name.en}&rdquo;</span>?
          </p>
          {category.resourceCount > 0 ? (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
              <AlertCircle size={14} className="text-red-600 shrink-0" />
              <p className="font-lato text-xs text-red-700 dark:text-red-400">
                This category has {category.resourceCount} resource(s) assigned. Reassign them first.
              </p>
            </div>
          ) : (
            <p className="font-lato text-xs text-w-600 dark:text-white/40 mb-4">This action cannot be undone.</p>
          )}
          <div className="flex gap-2">
            <ElegantButton variant="primary" onClick={onConfirm} disabled={category.resourceCount > 0} className="flex-1 text-sm py-2 bg-red-600 border-red-700 hover:bg-red-700">
              Delete
            </ElegantButton>
            <ElegantButton variant="outline" onClick={onClose} className="flex-1 text-sm py-2">
              Cancel
            </ElegantButton>
          </div>
        </div>
      )}
    </Modal>
  )
}
