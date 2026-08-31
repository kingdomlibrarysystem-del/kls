import { Plus } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { Category, CategoryFormState } from '@/lib/kcs-taxonomy'
import type { Resource } from '@/app/dashboard/library/_components/resources-data'
import { CategoriesTable } from './categories-table'
import { SubcategoryForm } from './subcategory-form'

interface SubcategoriesPanelProps {
  categories: Category[]
  resources: Resource[]
  form: CategoryFormState
  errors: Partial<CategoryFormState>
  submitting: boolean
  formOpen: boolean
  editTarget: Category | null
  onAddNew: () => void
  onNameEnChange: (value: string) => void
  onFieldChange: (patch: Partial<CategoryFormState>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancelEdit: () => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

/** Manage Categories "Subcategories" tab — full-width table of scrolls (child categories), with a modal-based Create/Edit form requiring a Parent Category + Status. */
export function SubcategoriesPanel({ categories, resources, form, errors, submitting, formOpen, editTarget, onAddNew, onNameEnChange, onFieldChange, onSubmit, onCancelEdit, onEdit, onDelete }: SubcategoriesPanelProps) {
  const subs = categories.filter((c) => c.parentId)
  const parentOptions = categories.filter((c) => !c.parentId)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-lato text-xs text-w-600 dark:text-white/50 uppercase tracking-wider font-semibold">{subs.length} subcategories</p>
        <ElegantButton type="button" variant="primary" onClick={onAddNew} disabled={parentOptions.length === 0} className="flex items-center gap-1.5 text-sm py-1.5 px-3">
          <Plus size={14} /> Add Subcategory
        </ElegantButton>
      </div>
      {parentOptions.length === 0 && (
        <p className="font-lato text-xs text-w-500 dark:text-white/30 mb-2">Create a root category first before adding subcategories.</p>
      )}
      <CategoriesTable categories={subs} resources={resources} onEdit={onEdit} onDelete={onDelete} />

      <Modal open={formOpen} onClose={onCancelEdit} title={editTarget ? 'Edit Subcategory' : 'New Subcategory'} size="lg">
        <SubcategoryForm
          form={form}
          errors={errors}
          submitting={submitting}
          editTarget={editTarget}
          parentOptions={parentOptions}
          onNameEnChange={onNameEnChange}
          onFieldChange={onFieldChange}
          onSubmit={onSubmit}
          onCancelEdit={onCancelEdit}
        />
      </Modal>
    </div>
  )
}
