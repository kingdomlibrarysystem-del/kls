'use client'

import { useState } from 'react'
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { BORROW_DURATION_PRESETS, type ResourceFormData } from './resource-form-schema'

interface ResourceFormBorrowFieldsProps {
  register: UseFormRegister<ResourceFormData>
  errors: FieldErrors<ResourceFormData>
  setValue: UseFormSetValue<ResourceFormData>
  watch: UseFormWatch<ResourceFormData>
}

/**
 * Borrow (RENTAL)-specific fields — its own real charge (borrowPrice,
 * independent from `price`, which is Reserve/"Buy"-only) and a real
 * return-period control (7/14/30-day presets, or a genuine custom day
 * count) replacing the old single global Settings.defaultBorrowPeriodDays
 * fallback every resource previously shared. Split out of
 * ResourceFormDetails to keep that file under the 200-line cap.
 */
export function ResourceFormBorrowFields({ register, errors, setValue, watch }: ResourceFormBorrowFieldsProps) {
  const borrowDurationDays = watch('borrowDurationDays')
  const presetMatch = BORROW_DURATION_PRESETS.find((p) => p.days === borrowDurationDays)
  const [isCustom, setIsCustom] = useState(!presetMatch && borrowDurationDays !== undefined)

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <FieldLabel htmlFor="borrowPrice" required>Borrow Price (RWF)</FieldLabel>
        <FormInput id="borrowPrice" type="number" min={0} step={100} error={errors.borrowPrice?.message} {...register('borrowPrice', { valueAsNumber: true })} />
        <p className="font-lato text-xs text-w-600 mt-1">Charged to Borrow — separate from the Reserve price above.</p>
      </div>
      <div>
        <FieldLabel htmlFor="borrowDurationPreset" required>Return Period</FieldLabel>
        <select
          id="borrowDurationPreset"
          className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
          value={isCustom ? 'custom' : String(borrowDurationDays)}
          onChange={(e) => {
            if (e.target.value === 'custom') { setIsCustom(true); return }
            setIsCustom(false)
            setValue('borrowDurationDays', Number(e.target.value), { shouldValidate: true })
          }}
        >
          {BORROW_DURATION_PRESETS.map((p) => <option key={p.days} value={p.days}>{p.label}</option>)}
          <option value="custom">Custom</option>
        </select>
      </div>
      {isCustom && (
        <div>
          <FieldLabel htmlFor="borrowDurationDays" required>Custom Days</FieldLabel>
          <FormInput id="borrowDurationDays" type="number" min={1} error={errors.borrowDurationDays?.message} {...register('borrowDurationDays', { valueAsNumber: true })} />
        </div>
      )}
    </div>
  )
}
