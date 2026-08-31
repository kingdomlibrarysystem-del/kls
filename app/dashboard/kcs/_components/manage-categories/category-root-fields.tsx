import { CloudinaryUploadField } from "@/components/ui/cloudinary-upload-field";
import { FieldLabel, inputCls } from "./field-label";
import type { CategoryFormState } from "@/lib/kcs-taxonomy";

interface CategoryRootFieldsProps {
  form: CategoryFormState;
  onFieldChange: (patch: Partial<CategoryFormState>) => void;
}

/** The 7 root/pillar-only fields, extracted out of CategoryFormPanel to keep that file under the 200-line ceiling. */
export function CategoryRootFields({ form, onFieldChange }: CategoryRootFieldsProps) {
  return (
    <div className="space-y-4 pt-2 border-t border-w-200 dark:border-white/10">
      <p className="font-cinzel text-xs font-semibold text-w-700 dark:text-white/60 uppercase tracking-wider">
        Root Category Details
      </p>

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
          onClear={() => onFieldChange({ heroImage: "" })}
        />
      </div>
    </div>
  );
}
