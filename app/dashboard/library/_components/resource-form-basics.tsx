'use client'

import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import type { Category } from '@/lib/kcs-taxonomy'
import type { ResourceFormData } from './resource-form-schema'

interface ResourceFormBasicsProps {
  register: UseFormRegister<ResourceFormData>
  errors: FieldErrors<ResourceFormData>
  leafCategories: Category[]
  rootCategories: Category[]
}

/** Title/Author/KCS Scroll/Total Quantity — extracted from resource-form-modal.tsx to keep it under the 200-line cap. */
export function ResourceFormBasics({ register, errors, leafCategories, rootCategories }: ResourceFormBasicsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="title" required>Title</FieldLabel>
          <FormInput id="title" type="text" placeholder="Resource title" error={errors.title?.message} {...register('title')} />
        </div>
        <div>
          <FieldLabel htmlFor="author" required>Author</FieldLabel>
          <FormInput id="author" type="text" placeholder="Author name" error={errors.author?.message} {...register('author')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="categoryId" required>KCS Scroll</FieldLabel>
          <select
            id="categoryId"
            className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
            {...register('categoryId')}
          >
            <option value="" disabled>Select a category…</option>
            {rootCategories.map((root) => (
              <optgroup key={root.id} label={`${root.name.en} (${root.code})`}>
                {leafCategories.filter((c) => c.parentId === root.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name.en}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="totalQty" required>Total Quantity</FieldLabel>
          <FormInput id="totalQty" type="number" min={0} error={errors.totalQty?.message} {...register('totalQty', { valueAsNumber: true })} />
        </div>
      </div>
    </>
  )
}
