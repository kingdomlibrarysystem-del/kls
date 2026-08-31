import { ElegantButton } from '@/components/ui/elegant-button'
import { FieldLabel, inputCls } from './field-label'
import { toSlug, type Category, type CategoryFormState, type CategoryStatus } from '@/lib/kcs-taxonomy'

const STATUS_OPTIONS: { value: CategoryStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
]

interface SubcategoryFormProps {
  form: CategoryFormState
  errors: Partial<CategoryFormState>
  submitting: boolean
  editTarget: Category | null
  parentOptions: Category[]
  onNameEnChange: (value: string) => void
  onFieldChange: (patch: Partial<CategoryFormState>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancelEdit: () => void
}

/** Create/Edit form for a subcategory (scroll) — requires a Parent Category and shows Status, no pillar-only detail fields. Rendered inside a Modal, which supplies the title/close chrome. */
export function SubcategoryForm({
  form,
  errors,
  submitting,
  editTarget,
  parentOptions,
  onNameEnChange,
  onFieldChange,
  onSubmit,
  onCancelEdit,
}: SubcategoryFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <FieldLabel required>Name</FieldLabel>
        <input type="text" placeholder="e.g. Genesis" value={form.nameEn} onChange={(e) => onNameEnChange(e.target.value)} className={inputCls(!!errors.nameEn)} />
        {errors.nameEn && <p className="mt-1 font-lato text-xs text-red-500">{errors.nameEn}</p>}
      </div>

      <div>
        <FieldLabel required>Slug</FieldLabel>
        <input type="text" placeholder="e.g. genesis" value={form.slug} onChange={(e) => onFieldChange({ slug: toSlug(e.target.value) })} className={inputCls(!!errors.slug)} />
        {errors.slug ? <p className="mt-1 font-lato text-xs text-red-500">{errors.slug}</p> : <p className="mt-1 font-lato text-xs text-w-500 dark:text-white/30">Auto-generated · must be unique</p>}
      </div>

      <div>
        <FieldLabel required>Parent Category</FieldLabel>
        <select value={form.parentId} onChange={(e) => onFieldChange({ parentId: e.target.value })} className={inputCls(!!errors.parentId)}>
          <option value="">— Select a root category —</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name.en}</option>
          ))}
        </select>
        {errors.parentId ? (
          <p className="mt-1 font-lato text-xs text-red-500">{errors.parentId}</p>
        ) : (
          <p className="mt-1 font-lato text-xs text-w-500 dark:text-white/30">Which pillar this scroll belongs under</p>
        )}
      </div>

      <div className="pt-2 border-t border-w-200 dark:border-white/10">
        <FieldLabel>Status</FieldLabel>
        <select value={form.status} onChange={(e) => onFieldChange({ status: e.target.value as CategoryStatus })} className={inputCls()}>
          <option value="">— Not set —</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <ElegantButton type="submit" variant="primary" loading={submitting} className="flex-1 text-sm py-2">
          {editTarget ? 'Save Changes' : 'Create Subcategory'}
        </ElegantButton>
        <ElegantButton type="button" variant="outline" onClick={onCancelEdit} className="text-sm py-2 px-4">
          Cancel
        </ElegantButton>
      </div>
    </form>
  )
}
