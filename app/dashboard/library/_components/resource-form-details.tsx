'use client'

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { BookOpen } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { RemoteImage } from '@/components/ui/remote-image'
import { bindingTypeLabels, mediaTypeLabels, type BindingType, type MediaType } from './resources-data'
import { TagInput } from './tag-input'
import type { ResourceFormData } from './resource-form-schema'

interface ResourceFormDetailsProps {
  register: UseFormRegister<ResourceFormData>
  control: Control<ResourceFormData>
  errors: FieldErrors<ResourceFormData>
  coverImageValue: string
}

/**
 * The fields the canonical Resource shape has that the form previously
 * never captured (description, publisher, language, pages, price,
 * bindingType, mediaType, tags, cover image) — split into its own file to
 * keep resource-form-modal.tsx under the 200-line cap now that the form
 * covers the full model the Detail modal already displays.
 */
export function ResourceFormDetails({ register, control, errors, coverImageValue }: ResourceFormDetailsProps) {
  return (
    <>
      <div>
        <FieldLabel htmlFor="description" required>Description</FieldLabel>
        <textarea
          id="description"
          rows={3}
          placeholder="A short summary of this resource…"
          className={`w-full px-4 py-3 font-lato text-sm border rounded transition-colors focus:outline-none ${
            errors.description ? 'border-red-500 bg-red-50' : 'border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600'
          }`}
          {...register('description')}
        />
        {errors.description && <p className="text-red-600 text-xs mt-1 font-lato">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="publisher" required>Publisher</FieldLabel>
          <FormInput id="publisher" type="text" placeholder="Publisher name" error={errors.publisher?.message} {...register('publisher')} />
        </div>
        <div>
          <FieldLabel htmlFor="language" required>Language</FieldLabel>
          <FormInput id="language" type="text" placeholder="e.g. EN, HE, GR" error={errors.language?.message} {...register('language')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="pages" required>Pages</FieldLabel>
          <FormInput id="pages" type="number" min={1} error={errors.pages?.message} {...register('pages', { valueAsNumber: true })} />
        </div>
        <div>
          <FieldLabel htmlFor="price" required>Price (RWF)</FieldLabel>
          <FormInput id="price" type="number" min={0} step={100} error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="bindingType" required>Binding</FieldLabel>
          <select id="bindingType" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('bindingType')}>
            {(Object.keys(bindingTypeLabels) as BindingType[]).map((b) => <option key={b} value={b}>{bindingTypeLabels[b]}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="mediaType" required>Media Type</FieldLabel>
          <select id="mediaType" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('mediaType')}>
            {(Object.keys(mediaTypeLabels) as MediaType[]).map((m) => <option key={m} value={m}>{mediaTypeLabels[m]}</option>)}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="coverImage" required>Cover Image URL</FieldLabel>
        <FormInput id="coverImage" type="text" placeholder="https://images.unsplash.com/..." error={errors.coverImage?.message} {...register('coverImage')} />
        {coverImageValue && (
          <div className="relative w-16 h-22 mt-2 rounded overflow-hidden border border-w-300 bg-w-200">
            <RemoteImage
              src={coverImageValue}
              alt="Cover preview"
              fill
              sizes="64px"
              className="object-cover"
              fallback={<div className="w-full h-full flex items-center justify-center"><BookOpen size={16} className="text-w-400" /></div>}
            />
          </div>
        )}
      </div>

      <div>
        <FieldLabel htmlFor="tags">Tags</FieldLabel>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
        />
      </div>
    </>
  )
}
