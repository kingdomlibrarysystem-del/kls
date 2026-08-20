'use client'

import { useState } from 'react'
import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from 'react-hook-form'
import { BookOpen } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { RemoteImage } from '@/components/ui/remote-image'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { bindingTypeLabels, mediaTypeLabels, type BindingType, type MediaType } from './resources-data'
import { TagInput } from './tag-input'
import { ResourceFormMediaFiles } from './resource-form-media-files'
import { LANGUAGE_OPTIONS, type ResourceFormData } from './resource-form-schema'

interface ResourceFormDetailsProps {
  register: UseFormRegister<ResourceFormData>
  control: Control<ResourceFormData>
  errors: FieldErrors<ResourceFormData>
  setValue: UseFormSetValue<ResourceFormData>
  watch: UseFormWatch<ResourceFormData>
  isCreating: boolean
}

/**
 * The fields the canonical Resource shape has beyond title/author/
 * category/quantity — description, publisher, real language dropdown,
 * pages (auto-fillable from an uploaded PDF), price, binding/media type,
 * tags, and real Cloudinary-uploaded cover/document/audio/video. Split
 * out of resource-form-modal.tsx to keep it under the 200-line cap.
 */
export function ResourceFormDetails({ register, control, errors, setValue, watch, isCreating }: ResourceFormDetailsProps) {
  const coverImageValue = watch('coverImage')
  const mediaType = watch('mediaType')
  /** Tracks whether the current coverImage came from this picker (vs. the typed-URL text input above it) — so the picker only shows its "uploaded" state for a genuine upload, not a pasted URL. */
  const [coverUploaded, setCoverUploaded] = useState(false)

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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <FieldLabel htmlFor="publisher" required>Publisher</FieldLabel>
          <FormInput id="publisher" type="text" placeholder="Publisher name" error={errors.publisher?.message} {...register('publisher')} />
        </div>
        <div>
          <FieldLabel htmlFor="language" required>Language</FieldLabel>
          <select
            id="language"
            className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
            {...register('language')}
          >
            {LANGUAGE_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="price" required>Price (RWF)</FieldLabel>
          <FormInput id="price" type="number" min={0} step={100} error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <FieldLabel htmlFor="pages" required>Pages</FieldLabel>
          <FormInput id="pages" type="number" min={1} error={errors.pages?.message} {...register('pages', { valueAsNumber: true })} />
          <p className="font-lato text-xs text-w-600 mt-1">Auto-filled from the uploaded document.</p>
        </div>
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
        <FieldLabel htmlFor="freePreviewChapterCount">Free Preview Chapters</FieldLabel>
        <FormInput id="freePreviewChapterCount" type="number" min={0} error={errors.freePreviewChapterCount?.message} {...register('freePreviewChapterCount', { valueAsNumber: true })} />
        <p className="font-lato text-xs text-w-600 mt-1">
          Readable for free before the reader shows a "Buy to Continue" paywall. Ignored while price is 0 — a free resource stays fully readable.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_120px] gap-4 items-start">
        <Controller
          name="coverImage"
          control={control}
          render={({ field }) => (
            <div>
              <FieldLabel htmlFor="coverImage" required>Cover Image</FieldLabel>
              <FormInput
                id="coverImage"
                type="text"
                placeholder="https://images.unsplash.com/... (or upload below)"
                error={errors.coverImage?.message}
                value={field.value}
                onChange={(e) => { field.onChange(e.target.value); setCoverUploaded(false) }}
                onBlur={field.onBlur}
              />
              <div className="mt-2">
                <CloudinaryUploadField
                  id="coverImageFile"
                  kind="image"
                  accept="image/*"
                  label="Upload cover image"
                  value={coverUploaded ? field.value : ''}
                  onUploaded={(result) => { field.onChange(result.url); setCoverUploaded(true) }}
                  onClear={() => { field.onChange(''); setCoverUploaded(false) }}
                />
              </div>
            </div>
          )}
        />
        <div className="relative w-full h-32 rounded overflow-hidden border border-w-300 bg-w-200 mt-7">
          {coverImageValue ? (
            <RemoteImage
              src={coverImageValue}
              alt="Cover preview"
              fill
              sizes="120px"
              className="object-cover"
              fallback={<div className="w-full h-full flex items-center justify-center"><BookOpen size={20} className="text-w-400" /></div>}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><BookOpen size={20} className="text-w-400" /></div>
          )}
        </div>
      </div>

      <ResourceFormMediaFiles control={control} setValue={setValue} watch={watch} mediaType={mediaType} isCreating={isCreating} />

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
