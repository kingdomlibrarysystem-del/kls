import { ElegantButton } from "@/components/ui/elegant-button";
import { FieldLabel, inputCls } from "./field-label";
import { CategoryRootFields } from "./category-root-fields";
import { toSlug, type Category, type CategoryFormState, type CategoryStatus } from "@/lib/kcs-taxonomy";

const STATUS_OPTIONS: { value: CategoryStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
];

interface CategoryFormPanelProps {
  form: CategoryFormState;
  errors: Partial<CategoryFormState>;
  submitting: boolean;
  editTarget: Category | null;
  parentOptions: Category[];
  onNameEnChange: (value: string) => void;
  onFieldChange: (patch: Partial<CategoryFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
}

/** Create/Edit form, used only inside CategoryDetailView's Edit Modal (which supplies the title/close chrome) — the only remaining consumer since Manage Categories' inline panel split into RootCategoryForm/SubcategoryForm. */
export function CategoryFormPanel({
  form,
  errors,
  submitting,
  editTarget,
  parentOptions,
  onNameEnChange,
  onFieldChange,
  onSubmit,
  onCancelEdit,
}: CategoryFormPanelProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <FieldLabel required>Name</FieldLabel>
        <input
          type="text"
          placeholder="e.g. Philosophy"
          value={form.nameEn}
          onChange={(e) => onNameEnChange(e.target.value)}
          className={inputCls(!!errors.nameEn)}
        />
        {errors.nameEn && (
          <p className="mt-1 font-lato text-xs text-red-500">
            {errors.nameEn}
          </p>
        )}
      </div>

      <div>
        <FieldLabel required>Slug</FieldLabel>
        <input
          type="text"
          placeholder="e.g. philosophy"
          value={form.slug}
          onChange={(e) => onFieldChange({ slug: toSlug(e.target.value) })}
          className={inputCls(!!errors.slug)}
        />
        {errors.slug ? (
          <p className="mt-1 font-lato text-xs text-red-500">{errors.slug}</p>
        ) : (
          <p className="mt-1 font-lato text-xs text-w-500 dark:text-white/30">
            Auto-generated · must be unique
          </p>
        )}
      </div>

      <div>
        <FieldLabel>Parent Category</FieldLabel>
        <select
          value={form.parentId}
          onChange={(e) => onFieldChange({ parentId: e.target.value })}
          className={inputCls()}
        >
          <option value="">— None (root category) —</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name.en}
            </option>
          ))}
        </select>
        <p className="mt-1 font-lato text-xs text-w-500 dark:text-white/30">
          Leave empty to create a root category
        </p>
      </div>

      {form.parentId === "" ? (
        <CategoryRootFields form={form} onFieldChange={onFieldChange} />
      ) : (
        <div className="pt-2 border-t border-w-200 dark:border-white/10">
          <FieldLabel>Status</FieldLabel>
          <select
            value={form.status}
            onChange={(e) => onFieldChange({ status: e.target.value as CategoryStatus })}
            className={inputCls()}
          >
            <option value="">— Not set —</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <ElegantButton
          type="submit"
          variant="primary"
          loading={submitting}
          className="flex-1 text-sm py-2"
        >
          {editTarget ? "Save Changes" : "Create Category"}
        </ElegantButton>
        {editTarget && (
          <ElegantButton
            type="button"
            variant="outline"
            onClick={onCancelEdit}
            className="text-sm py-2 px-4"
          >
            Cancel
          </ElegantButton>
        )}
      </div>
    </form>
  );
}
