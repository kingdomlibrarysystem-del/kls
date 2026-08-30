import { FolderOpen } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { FieldLabel, inputCls } from './field-label'
import { toSlug, type Category, type CategoryFormState } from '@/lib/kcs-taxonomy'

interface RootCategoryFormProps {
  form: CategoryFormState
  errors: Partial<CategoryFormState>
  submitting: boolean
  editTarget: Category | null
  onNameEnChange: (value: string) => void
  onFieldChange: (patch: Partial<CategoryFormState>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancelEdit: () => void
}

/** Create/Edit form for a root (pillar) category — always root, so no Parent Category or Status field, just Name/Slug plus the 7 pillar-only detail fields. */
export function RootCategoryForm({
  form,
  errors,
  submitting,
  editTarget,
  onNameEnChange,
  onFieldChange,
  onSubmit,
  onCancelEdit,
}: RootCategoryFormProps) {
  return (
    <div className="bg-white dark:bg-white/5 border border-w-300 dark:border-white/10 rounded-lg p-5 sticky top-4">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-w-200 dark:border-white/10">
        <div>
          <h2 className="font-cinzel text-sm font-semibold text-w-950 dark:text-white tracking-wide">
            {editTarget ? 'Edit Root Category' : 'New Root Category'}
          </h2>
          <p className="font-lato text-xs text-w-600 dark:text-white/40 mt-0.5">
            {editTarget ? `Editing: ${editTarget.name.en}` : 'Add a new KCS pillar'}
          </p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-w-100 dark:bg-white/10 flex items-center justify-center">
          <FolderOpen size={16} className="text-w-600" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <FieldLabel required>Name</FieldLabel>
          <input type="text" placeholder="e.g. Foundation" value={form.nameEn} onChange={(e) => onNameEnChange(e.target.value)} className={inputCls(!!errors.nameEn)} />
          {errors.nameEn && <p className="mt-1 font-lato text-xs text-red-500">{errors.nameEn}</p>}
        </div>

        <div>
          <FieldLabel required>Slug</FieldLabel>
          <input type="text" placeholder="e.g. foundation" value={form.slug} onChange={(e) => onFieldChange({ slug: toSlug(e.target.value) })} className={inputCls(!!errors.slug)} />
          {errors.slug ? <p className="mt-1 font-lato text-xs text-red-500">{errors.slug}</p> : <p className="mt-1 font-lato text-xs text-w-500 dark:text-white/30">Auto-generated · must be unique</p>}
        </div>

        <div className="space-y-4 pt-2 border-t border-w-200 dark:border-white/10">
          <p className="font-cinzel text-xs font-semibold text-w-700 dark:text-white/60 uppercase tracking-wider">Pillar Details</p>

          <div>
            <FieldLabel>Code</FieldLabel>
            <input type="text" placeholder="e.g. KCS-FND" value={form.code} onChange={(e) => onFieldChange({ code: e.target.value })} className={inputCls()} />
          </div>

          <div>
            <FieldLabel>Subtitle</FieldLabel>
            <input type="text" placeholder="e.g. Constitution of the Kingdom" value={form.subtitle} onChange={(e) => onFieldChange({ subtitle: e.target.value })} className={inputCls()} />
          </div>

          <div>
            <FieldLabel>Range</FieldLabel>
            <input type="text" placeholder="e.g. Genesis – Deuteronomy" value={form.range} onChange={(e) => onFieldChange({ range: e.target.value })} className={inputCls()} />
          </div>

          <div>
            <FieldLabel>Theme</FieldLabel>
            <input type="text" placeholder="e.g. Origins and Covenant" value={form.theme} onChange={(e) => onFieldChange({ theme: e.target.value })} className={inputCls()} />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <input type="text" placeholder="One-sentence description" value={form.description} onChange={(e) => onFieldChange({ description: e.target.value })} className={inputCls()} />
          </div>

          <div>
            <FieldLabel>Detail</FieldLabel>
            <textarea rows={3} placeholder="Longer descriptive paragraph" value={form.detail} onChange={(e) => onFieldChange({ detail: e.target.value })} className={inputCls()} />
          </div>

          <div>
            <FieldLabel>Hero Image</FieldLabel>
            <CloudinaryUploadField
              id="category-hero-image"
              accept="image/*"
              label="Upload hero image"
              kind="image"
              value={form.heroImage}
              onUploaded={(result) => onFieldChange({ heroImage: result.url })}
              onClear={() => onFieldChange({ heroImage: '' })}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <ElegantButton type="submit" variant="primary" loading={submitting} className="flex-1 text-sm py-2">
            {editTarget ? 'Save Changes' : 'Create Root Category'}
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
