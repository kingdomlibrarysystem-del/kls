'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { mediaTypeCodeFromName, type MediaTypeOption } from '@/lib/media-types-shared'

type CapabilityKey = 'allowsChapters' | 'allowsDocument' | 'allowsAudio' | 'allowsVideo'

/** What each capability switch means for the resource form — the form shows exactly the fields a type allows. */
const CAPABILITIES: { key: CapabilityKey; label: string; hint: string }[] = [
  { key: 'allowsChapters', label: 'Written chapters', hint: 'Text typed chapter by chapter and read in the in-app reader.' },
  { key: 'allowsDocument', label: 'Document (PDF)', hint: 'An uploaded PDF, read page by page.' },
  { key: 'allowsAudio', label: 'Audio', hint: 'An uploaded audio file.' },
  { key: 'allowsVideo', label: 'Video', hint: 'An uploaded video file.' },
]

interface FormState {
  name: string
  description: string
  allowsChapters: boolean
  allowsDocument: boolean
  allowsAudio: boolean
  allowsVideo: boolean
}

const EMPTY: FormState = { name: '', description: '', allowsChapters: false, allowsDocument: false, allowsAudio: false, allowsVideo: false }

interface MediaTypeFormModalProps {
  /** Type being edited, or null when adding a new one. */
  editing: MediaTypeOption | null
  onClose: () => void
  /** Called with the saved type once the API accepted it. */
  onSaved: (saved: MediaTypeOption, wasEditing: boolean) => void
}

/**
 * Add / edit a media type. Built-in types can be renamed and described, but
 * not change what they contain. Mounted only while open (the parent keys it
 * by the edited type), so the form starts from the right values without an
 * effect.
 */
export function MediaTypeFormModal({ editing, onClose, onSaved }: MediaTypeFormModalProps) {
  const [form, setForm] = useState<FormState>(() => editing
    ? {
        name: editing.name,
        description: editing.description ?? '',
        allowsChapters: editing.allowsChapters,
        allowsDocument: editing.allowsDocument,
        allowsAudio: editing.allowsAudio,
        allowsVideo: editing.allowsVideo,
      }
    : EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const flagsLocked = !!editing?.isSystem
  const hasCapability = CAPABILITIES.some((c) => form[c.key])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    if (name.length < 2) { setError('Name must be at least 2 characters'); return }
    if (!hasCapability) { setError('Choose at least one kind of content this media type contains'); return }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(editing ? `/api/media-types/${editing.id}` : '/api/media-types', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: form.description.trim(),
          // Built-in types keep their content flags — the API rejects a change, so don't send them.
          ...(!flagsLocked && {
            allowsChapters: form.allowsChapters,
            allowsDocument: form.allowsDocument,
            allowsAudio: form.allowsAudio,
            allowsVideo: form.allowsVideo,
          }),
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not save the media type')
      onSaved(json.data as MediaTypeOption, !!editing)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the media type')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={editing ? `Edit Media Type: ${editing.name}` : 'Add Media Type'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="media-type-name">Name</Label>
          <Input
            id="media-type-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Sermon Notes"
            maxLength={60}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {editing
              ? <>Code <span className="font-mono text-foreground">{editing.code}</span> — fixed, because existing resources store it.</>
              : form.name.trim()
                ? <>Will be saved with the code <span className="font-mono text-foreground">{mediaTypeCodeFromName(form.name) || '—'}</span>.</>
                : 'Shown in the resource form and on every book page.'}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="media-type-description">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Textarea
            id="media-type-description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="When should staff pick this type?"
            rows={2}
            maxLength={300}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">What a resource of this type contains</legend>
          <p className="text-xs text-muted-foreground">
            {flagsLocked
              ? 'This is a built-in type: existing resources depend on it, so its content cannot be changed.'
              : 'The resource form shows only the fields switched on here.'}
          </p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {CAPABILITIES.map((c) => (
              <label key={c.key} htmlFor={`media-type-${c.key}`} className="flex items-center justify-between gap-4 px-3 py-2.5">
                <span>
                  <span className="block text-sm font-medium text-foreground">{c.label}</span>
                  <span className="block text-xs text-muted-foreground">{c.hint}</span>
                </span>
                <Switch
                  id={`media-type-${c.key}`}
                  checked={form[c.key]}
                  disabled={flagsLocked}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, [c.key]: checked }))}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Media Type'}</Button>
        </div>
      </form>
    </Modal>
  )
}
