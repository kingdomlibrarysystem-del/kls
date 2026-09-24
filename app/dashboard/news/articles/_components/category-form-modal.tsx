'use client'

import { useState } from 'react'
import { FormInput } from '@/components/ui/form-input'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { DEFAULT_CATEGORY_COLOR, CATEGORY_COLOR_PRESETS } from '../../_shared/news-data'

interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

/** Quick-create for a news category straight from the Articles page — mirrors the New Article flow. */
export function CategoryFormModal({ open, onClose, onCreated }: CategoryFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(DEFAULT_CATEGORY_COLOR)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const reset = () => { setName(''); setDescription(''); setColor(DEFAULT_CATEGORY_COLOR); setFormError('') }

  const handleClose = () => { reset(); onClose() }

  const handleSave = async () => {
    if (!name.trim()) { setFormError('Name is required'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/news/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, color }),
      })
      const json = await res.json()
      if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create')
      handleClose()
      onCreated()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Category" size="sm">
      <div className="space-y-3">
        {formError && <p className="text-red-600 text-xs font-lato">{formError}</p>}
        <div>
          <label className="font-lato text-xs font-semibold text-w-800 block mb-1">Name *</label>
          <FormInput id="new-cat-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ministry Updates" />
        </div>
        <div>
          <label className="font-lato text-xs font-semibold text-w-800 block mb-1">Description (optional)</label>
          <FormInput id="new-cat-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
        </div>
        <div>
          <label className="font-lato text-xs font-semibold text-w-800 block mb-1.5">Color</label>
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORY_COLOR_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setColor(hex)}
                className={`w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 ${color === hex ? 'ring-2 ring-offset-2 ring-w-950' : ''}`}
                style={{ background: hex }}
                aria-label={`Use color ${hex}`}
              />
            ))}
            <label className="flex items-center gap-1.5 cursor-pointer ml-1">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 cursor-pointer border border-w-300 rounded"
                aria-label="Custom color"
              />
              <span className="font-lato text-xs text-w-600" style={{ color: 'var(--text-muted)' }}>Custom</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <ElegantButton type="button" variant="outline" onClick={handleClose}>Cancel</ElegantButton>
          <ElegantButton type="button" variant="primary" loading={saving} onClick={handleSave}>Create</ElegantButton>
        </div>
      </div>
    </Modal>
  )
}