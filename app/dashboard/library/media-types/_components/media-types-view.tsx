'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMediaTypes } from '@/lib/client/use-media-types'
import type { MediaTypeOption } from '@/lib/media-types-shared'
import { MediaTypeFormModal } from './media-type-form-modal'

const CONTENT_LABELS: { key: 'allowsChapters' | 'allowsDocument' | 'allowsAudio' | 'allowsVideo'; label: string }[] = [
  { key: 'allowsChapters', label: 'Chapters' },
  { key: 'allowsDocument', label: 'Document' },
  { key: 'allowsAudio', label: 'Audio' },
  { key: 'allowsVideo', label: 'Video' },
]

const bySortOrder = (a: MediaTypeOption, b: MediaTypeOption) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)

/**
 * Admin list of media types with add / edit / delete. The list arrives from
 * the server page; after each change the local list is updated from the API
 * response and the shared `/api/media-types` cache is refreshed so the
 * resource form's dropdown shows the change without a reload.
 */
export function MediaTypesView({ initialMediaTypes }: { initialMediaTypes: MediaTypeOption[] }) {
  const [mediaTypes, setMediaTypes] = useState(initialMediaTypes)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MediaTypeOption | null>(null)
  const [deleting, setDeleting] = useState<MediaTypeOption | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [toast, setToast] = useState('')
  const { refetch } = useMediaTypes()

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleSaved = (saved: MediaTypeOption, wasEditing: boolean) => {
    setMediaTypes((list) => {
      const next = wasEditing
        ? list.map((t) => (t.id === saved.id ? { ...saved, resourceCount: t.resourceCount ?? 0 } : t))
        : [...list, { ...saved, resourceCount: 0 }]
      return next.sort(bySortOrder)
    })
    setFormOpen(false)
    showToast(wasEditing ? `"${saved.name}" updated` : `"${saved.name}" added — it is now available in the resource form`)
    void refetch()
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/media-types/${deleting.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not delete the media type')
      setMediaTypes((list) => list.filter((t) => t.id !== deleting.id))
      showToast(`"${deleting.name}" deleted`)
      setDeleting(null)
      void refetch()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete the media type')
    } finally {
      setDeleteBusy(false)
    }
  }

  const columns: Column<MediaTypeOption>[] = [
    {
      key: 'name',
      label: 'Media Type',
      sortable: true,
      render: (t) => (
        <div>
          <p className="flex items-center gap-2 font-semibold text-foreground">
            {t.name}
            {t.isSystem && <Badge variant="secondary">Built-in</Badge>}
          </p>
          {t.description && <p className="max-w-md text-xs text-muted-foreground">{t.description}</p>}
        </div>
      ),
    },
    { key: 'code', label: 'Code', sortable: true, render: (t) => <span className="font-mono text-xs text-muted-foreground">{t.code}</span> },
    {
      key: 'contains',
      label: 'Contains',
      render: (t) => {
        const items = CONTENT_LABELS.filter((c) => t[c.key])
        return items.length === 0
          ? <span className="text-xs text-muted-foreground">—</span>
          : <div className="flex flex-wrap gap-1">{items.map((c) => <Badge key={c.key} variant="outline">{c.label}</Badge>)}</div>
      },
    },
    {
      key: 'resourceCount',
      label: 'Resources',
      sortable: true,
      render: (t) => <span suppressHydrationWarning className="font-semibold text-foreground">{(t.resourceCount ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (t) => {
        const inUse = (t.resourceCount ?? 0) > 0
        const blocked = t.isSystem ? 'Built-in media types cannot be deleted' : inUse ? 'In use by resources — reassign them first' : ''
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="outline" size="sm" onClick={() => { setEditing(t); setFormOpen(true) }} aria-label={`Edit ${t.name}`}>
              <Pencil /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!!blocked}
              title={blocked || undefined}
              onClick={() => { setDeleteError(''); setDeleting(t) }}
              aria-label={`Delete ${t.name}`}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 /> Delete
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {toast && (
        <div role="status" className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" /> {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          These are the options of the <span className="font-medium text-foreground">Media Type</span> field when adding a book.
          Each type decides which content fields the form shows.
        </p>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus /> Add Media Type
        </Button>
      </div>

      <DataTable<MediaTypeOption>
        data={mediaTypes}
        columns={columns}
        rowKey={(t) => t.id}
        searchPlaceholder="Search media types..."
        searchFilter={(t, q) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)}
        emptyMessage="No media types found."
      />

      {formOpen && <MediaTypeFormModal key={editing?.id ?? 'new'} editing={editing} onClose={() => setFormOpen(false)} onSaved={handleSaved} />}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Media Type" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deleting?.name}</span>? It will no longer be offered in the resource form.
          </p>
          {deleteError && (
            <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" /> {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteBusy}>{deleteBusy ? 'Deleting…' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
