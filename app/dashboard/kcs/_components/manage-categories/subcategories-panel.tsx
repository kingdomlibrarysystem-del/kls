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
  editTarget: Category | null
  onNameEnChange: (value: string) => void
  onFieldChange: (patch: Partial<CategoryFormState>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancelEdit: () => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

/** Manage Categories "Subcategories" tab — table of scrolls (child categories) plus a form scoped to a required Parent Category + Status. */
export function SubcategoriesPanel({ categories, resources, form, errors, submitting, editTarget, onNameEnChange, onFieldChange, onSubmit, onCancelEdit, onEdit, onDelete }: SubcategoriesPanelProps) {
  const subs = categories.filter((c) => c.parentId)
  const parentOptions = categories.filter((c) => !c.parentId)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-lato text-xs text-w-600 dark:text-white/50 uppercase tracking-wider font-semibold">{subs.length} subcategories</p>
        </div>
        <CategoriesTable categories={subs} resources={resources} onEdit={onEdit} onDelete={onDelete} />
      </div>

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
    </div>
  )
}
