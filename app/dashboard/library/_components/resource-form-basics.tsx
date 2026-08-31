'use client'

import { useState, useRef, useEffect } from 'react'
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import type { Category } from '@/lib/kcs-taxonomy'
import type { ResourceFormData } from './resource-form-schema'

interface ResourceFormBasicsProps {
  register: UseFormRegister<ResourceFormData>
  errors: FieldErrors<ResourceFormData>
  leafCategories: Category[]
  rootCategories: Category[]
  setValue: UseFormSetValue<ResourceFormData>
  categoryId: string
}

/** Title/Author/KCS Scroll/Total Quantity — extracted from resource-form-modal.tsx to keep it under the 200-line cap. */
export function ResourceFormBasics({ register, errors, leafCategories, rootCategories, setValue, categoryId }: ResourceFormBasicsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allOptions = [...rootCategories, ...leafCategories]
  const selectedLabel = allOptions.find((c) => c.id === categoryId)?.name.en ?? 'Select a category…'

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
        <div ref={ref} className="relative">
          <FieldLabel htmlFor="categoryId" required>KCS Scroll</FieldLabel>
          <button
            id="categoryId"
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none text-left flex justify-between items-center"
          >
            <span className={categoryId ? 'text-w-950' : 'text-w-400'}>{selectedLabel}</span>
            <span className="text-w-500">▾</span>
          </button>
          {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
          {open && (
            <div className="absolute z-[99999] top-full left-0 w-full mt-1 bg-white border border-w-300 rounded shadow-lg max-h-60 overflow-y-auto">
              {rootCategories.map((root) => {
                const children = leafCategories.filter((c) => c.parentId === root.id)
                return children.length > 0 ? (
                  <div key={root.id}>
                    <div className="px-3 py-1.5 font-lato text-xs font-semibold text-w-500 bg-w-50 sticky top-0">
                      {root.name.en} {root.code ? `(${root.code})` : ''}
                    </div>
                    {children.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => { setValue('categoryId', c.id, { shouldValidate: true }); setOpen(false) }}
                        className={`w-full text-left px-4 py-2 font-lato text-sm hover:bg-w-100 ${categoryId === c.id ? 'bg-w-100 font-semibold' : ''}`}
                      >
                        {c.name.en}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    key={root.id}
                    type="button"
                    onMouseDown={() => { setValue('categoryId', root.id, { shouldValidate: true }); setOpen(false) }}
                    className={`w-full text-left px-4 py-2 font-lato text-sm hover:bg-w-100 ${categoryId === root.id ? 'bg-w-100 font-semibold' : ''}`}
                  >
                    {root.name.en} {root.code ? `(${root.code})` : ''}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div>
          <FieldLabel htmlFor="totalQty" required>Total Quantity</FieldLabel>
          <FormInput id="totalQty" type="number" min={0} error={errors.totalQty?.message} {...register('totalQty', { valueAsNumber: true })} />
        </div>
      </div>
    </>
  )
}
