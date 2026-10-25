'use client'

import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { BadgeCheck, Hash } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { KLP_FORMATS, formatLibraryId } from '@/lib/klp-code'
import type { CollectionOption } from '@/lib/data/klp-register'
import type { Resource } from './resources-data'
import type { ResourceFormData } from './resource-form-schema'

const selectCls = 'w-full px-4 py-3 font-lato text-sm rounded-lg border border-input bg-form-bg text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 dark:bg-input/30'

interface Props {
  register: UseFormRegister<ResourceFormData>
  errors: FieldErrors<ResourceFormData>
  collections: CollectionOption[]
  /** The record being edited — once it has a KLP code, the code parts are locked. */
  editing: Resource | null
}

/**
 * Kingdom Library Publication Code fields. KLP Code and Kingdom Library ID
 * are generated on approval; here staff pick the collection, edition and
 * format they are built from, and can record the official ISBN later.
 */
export function ResourceFormPublicationCode({ register, errors, collections, editing }: Props) {
  const locked = !!editing?.klpCode
  const active = collections.filter((c) => c.active || c.code === editing?.klpCollection)

  return (
    <fieldset className="space-y-4 rounded-lg border border-w-300 dark:border-white/10 p-4">
      <legend className="flex items-center gap-1.5 px-1 font-cinzel text-sm font-semibold text-w-950">
        <Hash size={14} /> Publication code
      </legend>

      {locked ? (
        <div className="grid gap-2 rounded-md bg-w-50 dark:bg-white/5 p-3 text-sm sm:grid-cols-2">
          <p><span className="block text-xs text-w-600">KLP Code</span><span className="font-mono font-semibold text-w-950">{editing!.klpCode}</span></p>
          <p><span className="block text-xs text-w-600">Kingdom Library ID</span><span className="font-mono font-semibold text-w-950">{formatLibraryId(editing!.libraryId)}</span></p>
          <p className="sm:col-span-2 flex items-center gap-1 text-xs text-w-600"><BadgeCheck size={13} /> Assigned when it was published — codes never change. A new edition or format is added as its own record.</p>
        </div>
      ) : (
        <p className="font-lato text-xs text-w-600">
          The KLP Code (KLP-SS-YY-NNN-EE-F) and 13-digit Kingdom Library ID are created automatically when an admin approves this resource.
        </p>
      )}

      {/* Not rendered (rather than disabled) once locked: react-hook-form drops disabled fields' values. */}
      {!locked && (
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <FieldLabel htmlFor="klpCollection">KLP collection</FieldLabel>
          <select id="klpCollection" className={selectCls} {...register('klpCollection')}>
            <option value="">Choose before approval…</option>
            {active.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="klpEdition">Edition</FieldLabel>
          <FormInput id="klpEdition" type="number" min={1} max={99} error={errors.klpEdition?.message} {...register('klpEdition', { valueAsNumber: true })} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="klpFormat">Format</FieldLabel>
          <select id="klpFormat" className={selectCls} {...register('klpFormat')}>
            <option value="">Automatic (from the uploaded files)</option>
            {KLP_FORMATS.map((f) => <option key={f.letter} value={f.letter}>{f.letter} · {f.label}</option>)}
          </select>
        </div>
      </div>
      )}

      <div>
        <FieldLabel htmlFor="officialIsbn">Official ISBN</FieldLabel>
        <FormInput id="officialIsbn" type="text" inputMode="numeric" placeholder="Pending — leave empty until the ISBN agency assigns one" error={errors.officialIsbn?.message} {...register('officialIsbn')} />
        <p className="mt-1 font-lato text-xs text-w-600">ISBNs are issued by the ISBN agency only — the Kingdom Library ID above is not an ISBN.</p>
      </div>
    </fieldset>
  )
}
