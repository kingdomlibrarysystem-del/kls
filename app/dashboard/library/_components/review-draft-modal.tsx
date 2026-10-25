'use client'

import { useState } from 'react'
import { CheckCircle2, Undo2, Info } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { klpFormatLabel } from '@/lib/klp-code'
import type { CollectionOption } from '@/lib/data/klp-register'
import { reviewResource } from './use-resources'
import type { Resource } from './resources-data'

const selectCls = 'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

interface ReviewDraftModalProps {
  resource: Resource | null
  collections: CollectionOption[]
  onClose: () => void
  /** Called with the server's confirmation message after a successful decision. */
  onDone: (message: string) => void
}

/**
 * Approve or send back a DRAFT resource. Approving publishes it to readers
 * and assigns its KLP Code + Kingdom Library ID, so the approver confirms
 * (or picks) the KLP collection here.
 */
export function ReviewDraftModal({ resource, collections, onClose, onDone }: ReviewDraftModalProps) {
  const [collection, setCollection] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState('')
  const [lastId, setLastId] = useState<string | null>(null)

  // Reset the fields whenever a different draft is opened (adjust state during render, not in an effect).
  if (resource && resource.id !== lastId) {
    setLastId(resource.id)
    setCollection(resource.klpCollection ?? '')
    setNote('')
    setError('')
  }

  if (!resource) return null
  const active = collections.filter((c) => c.active)

  const decide = async (action: 'approve' | 'reject') => {
    setError('')
    if (action === 'approve' && !collection) { setError('Choose the KLP collection first — it is part of the publication code.'); return }
    if (action === 'reject' && note.trim().length < 3) { setError('Write a short note so the author knows what to change.'); return }
    setBusy(action)
    try {
      const { message } = await reviewResource(resource.id, action === 'approve' ? { action, klpCollection: collection } : { action, note: note.trim() })
      onDone(message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save — please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Modal open onClose={busy ? () => {} : onClose} title="Review draft" size="lg">
      <div className="space-y-4">
        <div>
          <p className="font-semibold text-foreground">{resource.title}</p>
          <p className="text-sm text-muted-foreground">by {resource.author}</p>
        </div>

        {resource.reviewNote && (
          <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Earlier note:</span> {resource.reviewNote}</p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="rv-collection">KLP collection</Label>
          <select id="rv-collection" value={collection} onChange={(e) => setCollection(e.target.value)} className={selectCls} disabled={!!busy}>
            <option value="">Choose a collection…</option>
            {active.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
          </select>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Approving publishes it to readers and assigns its KLP Code and 13-digit Kingdom Library ID automatically
            (edition {String(resource.klpEdition ?? 1).padStart(2, '0')}, format {resource.klpFormat ? `${resource.klpFormat} · ${klpFormatLabel(resource.klpFormat)}` : 'chosen from its files'}).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rv-note">Note for the author (only when sending back)</Label>
          <Textarea id="rv-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. The cover is blurry — please upload a sharper image." disabled={!!busy} />
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="outline" onClick={() => decide('reject')} disabled={!!busy}>
            <Undo2 className="size-4" /> {busy === 'reject' ? 'Sending back…' : 'Send back'}
          </Button>
          <Button onClick={() => decide('approve')} disabled={!!busy}>
            <CheckCircle2 className="size-4" /> {busy === 'approve' ? 'Publishing…' : 'Approve & publish'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
