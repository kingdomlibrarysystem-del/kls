import { FolderOpen } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'
import { FieldLabel, inputCls } from './field-label'
import { toSlug, type Category, type FormState } from './categories-data'

interface CategoryFormPanelProps {
  form: FormState
  errors: Partial<FormState>
  submitting: boolean
  editTarget: Category | null
  parentOptions: Category[]
  onNameEnChange: (value: string) => void
  onFieldChange: (patch: Partial<FormState>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancelEdit: () => void
}

/** Create/Edit form panel, extracted verbatim from the original page.tsx (no behavior changes). */
export function CategoryFormPanel({ form, errors, submitting, editTarget, parentOptions, onNameEnChange, onFieldChange, onSubmit, onCancelEdit }: CategoryFormPanelProps) {
  return (
    <div className="bg-white dark:bg-white/5 border border-w-300 dark:border-white/10 rounded-lg p-5 sticky top-4">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-w-200 dark:border-white/10">
        <div>
          <h2 className="font-cinzel text-sm font-semibold text-w-950 dark:text-white tracking-wide">
            {editTarget ? 'Edit Category' : 'New Category'}
          </h2>
          <p className="font-lato text-xs text-w-600 dark:text-white/40 mt-0.5">
            {editTarget ? `Editing: ${editTarget.name.en}` : 'Add a new library category'}
          </p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-w-100 dark:bg-white/10 flex items-center justify-center">
          <FolderOpen size={16} className="text-w-600" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <FieldLabel required>Name (English)</FieldLabel>
          <input type="text" placeholder="e.g. Philosophy" value={form.nameEn} onChange={(e) => onNameEnChange(e.target.value)} className={inputCls(!!errors.nameEn)} />
          {errors.nameEn && <p className="mt-1 font-lato text-xs text-red-500">{errors.nameEn}</p>}
        </div>

        <div>
          <FieldLabel required>Slug</FieldLabel>
          <input type="text" placeholder="e.g. philosophy" value={form.slug} onChange={(e) => onFieldChange({ slug: toSlug(e.target.value) })} className={inputCls(!!errors.slug)} />
          {errors.slug ? <p className="mt-1 font-lato text-xs text-red-500">{errors.slug}</p> : <p className="mt-1 font-lato text-xs text-w-500 dark:text-white/30">Auto-generated · must be unique</p>}
        </div>

        <div>
          <FieldLabel>Name (Français)</FieldLabel>
          <input type="text" placeholder="e.g. Philosophie" value={form.nameFr} onChange={(e) => onFieldChange({ nameFr: e.target.value })} className={inputCls()} />
        </div>

        <div>
          <FieldLabel>Name (Kinyarwanda)</FieldLabel>
          <input type="text" placeholder="e.g. Filozofi" value={form.nameRw} onChange={(e) => onFieldChange({ nameRw: e.target.value })} className={inputCls()} />
        </div>

        <div>
          <FieldLabel>Parent Category</FieldLabel>
          <select value={form.parentId} onChange={(e) => onFieldChange({ parentId: e.target.value })} className={inputCls()}>
            <option value="">— None (root category) —</option>
            {parentOptions.map((c) => <option key={c.id} value={c.id}>{c.name.en}</option>)}
          </select>
          <p className="mt-1 font-lato text-xs text-w-500 dark:text-white/30">Leave empty to create a root category</p>
        </div>

        <div className="flex gap-2 pt-2">
          <ElegantButton type="submit" variant="primary" loading={submitting} className="flex-1 text-sm py-2">
            {editTarget ? 'Save Changes' : 'Create Category'}
          </ElegantButton>
          {editTarget && (
            <ElegantButton type="button" variant="outline" onClick={onCancelEdit} className="text-sm py-2 px-4">
              Cancel
            </ElegantButton>
          )}
        </div>
      </form>
    </div>
  )
}
