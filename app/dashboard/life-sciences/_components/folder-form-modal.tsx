'use client'

import { useState } from 'react'
import { AlertCircle, FolderPlus } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { FormInput } from '@/components/ui/form-input'
import { Textarea } from '@/components/ui/textarea'
import { FieldLabel } from '@/components/ui/field-label'
import type { BookFolder } from '@/lib/data/book-folders'
import { createBookFolder, updateBookFolder } from './use-life-sciences'

interface FolderFormModalProps {
  open: boolean
  editing: BookFolder | null
  onClose: () => void
  onSaved: (message: string) => void
}

/** Create or rename a Life Sciences folder (category). */
export function FolderFormModal({ open, editing, onClose, onSaved }: FolderFormModalProps) {
  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [sortOrder, setSortOrder] = useState(String(editing?.sortOrder ?? 0))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Folder name is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      }
      if (editing) {
        await updateBookFolder(editing.id, payload)
        onSaved(`Updated "${payload.name}".`)
      } else {
        await createBookFolder(payload)
        onSaved(`Created "${payload.name}".`)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this folder — please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit Folder: ${editing.name}` : 'New Life Sciences Folder'} size="md">
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 font-lato text-xs text-red-700 dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div>
          <FieldLabel htmlFor="folder-name" required>Folder name</FieldLabel>
          <FormInput
            id="folder-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Anatomy"
            maxLength={120}
            autoFocus
          />
        </div>

        <div>
          <FieldLabel htmlFor="folder-description">Description</FieldLabel>
          <Textarea
            id="folder-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What kind of books live in this folder?"
            rows={3}
            maxLength={2000}
          />
        </div>

        <div>
          <FieldLabel htmlFor="folder-order">Display order</FieldLabel>
          <FormInput
            id="folder-order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="0"
          />
          <p className="mt-1 font-lato text-xs text-muted-foreground">Lower numbers appear first.</p>
        </div>

        <div className="flex gap-2 pt-2">
          <ElegantButton type="submit" variant="primary" loading={saving} loadingText="Saving…" className="flex-1 text-sm py-2">
            <FolderPlus size={15} /> {editing ? 'Save Changes' : 'Create Folder'}
          </ElegantButton>
          <ElegantButton type="button" variant="outline" onClick={onClose} className="text-sm py-2 px-4">
            Cancel
          </ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
