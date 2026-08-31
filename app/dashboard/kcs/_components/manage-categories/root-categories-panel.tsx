import { Plus } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { Category, CategoryFormState } from '@/lib/kcs-taxonomy'
import type { Resource } from '@/app/dashboard/library/_components/resources-data'
import { CategoriesTable } from './categories-table'
import { RootCategoryForm } from './root-category-form'

interface RootCategoriesPanelProps {
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

/** Manage Categories "Root Categories" tab — full-width table of the 8 KCS pillars, with a modal-based Create/Edit form scoped to root-only fields. */
export function RootCategoriesPanel({ categories, resources, form, errors, submitting, formOpen, editTarget, onAddNew, onNameEnChange, onFieldChange, onSubmit, onCancelEdit, onEdit, onDelete }: RootCategoriesPanelProps) {
  const roots = categories.filter((c) => !c.parentId)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-lato text-xs text-w-600 dark:text-white/50 uppercase tracking-wider font-semibold">{roots.length} root categories</p>
        <ElegantButton type="button" variant="primary" onClick={onAddNew} className="flex items-center gap-1.5 text-sm py-1.5 px-3">
          <Plus size={14} /> Add Root Category
        </ElegantButton>
      </div>
      <CategoriesTable categories={roots} resources={resources} onEdit={onEdit} onDelete={onDelete} />

      <Modal open={formOpen} onClose={onCancelEdit} title={editTarget ? 'Edit Root Category' : 'New Root Category'} size="lg">
        <RootCategoryForm
          form={form}
          errors={errors}
          submitting={submitting}
          editTarget={editTarget}
          onNameEnChange={onNameEnChange}
          onFieldChange={onFieldChange}
          onSubmit={onSubmit}
          onCancelEdit={onCancelEdit}
        />
      </Modal>
    </div>
  )
}
