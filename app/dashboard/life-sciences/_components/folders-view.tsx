'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  ArchiveRestore,
  AlertTriangle,
  BookCopy,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { BookFolder } from '@/lib/data/book-folders'
import { useBookFolders, updateBookFolder, deleteBookFolder } from './use-life-sciences'
import { FolderFormModal } from './folder-form-modal'

type StatusFilter = 'active' | 'archived' | 'all'

/** Folder-first Life Sciences management: create, edit, archive, restore and delete categories. */
export function FoldersView() {
  const { data, loading, error, refetch } = useBookFolders({ includeArchived: true })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BookFolder | null>(null)
  const [toast, setToast] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 5000)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((folder) => {
      const statusOk = statusFilter === 'all' || folder.status === statusFilter
      const searchOk = !q || folder.name.toLowerCase().includes(q) || folder.description.toLowerCase().includes(q)
      return statusOk && searchOk
    })
  }, [data, search, statusFilter])

  const activeCount = data.filter((f) => f.status === 'active').length
  const archivedCount = data.filter((f) => f.status === 'archived').length
  const totalBooks = data.reduce((sum, f) => sum + f.bookCount, 0)

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (folder: BookFolder) => { setEditing(folder); setFormOpen(true) }

  const toggleArchive = async (folder: BookFolder) => {
    setBusyId(folder.id)
    try {
      const next = folder.status === 'active' ? 'archived' : 'active'
      await updateBookFolder(folder.id, { status: next })
      showToast(next === 'archived' ? `"${folder.name}" archived.` : `"${folder.name}" restored.`)
      refetch()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update this folder.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (folder: BookFolder) => {
    if (!window.confirm(`Delete "${folder.name}" permanently? This cannot be undone.`)) return
    setBusyId(folder.id)
    try {
      await deleteBookFolder(folder.id)
      showToast(`"${folder.name}" deleted.`)
      refetch()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete this folder.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading folders">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load Life Sciences folders" description={error} />
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          className="mb-0"
          title="Life Sciences"
          subtitle="Organise document-only books into folders — PDF and PowerPoint, nothing else."
        />
        <ElegantButton variant="primary" onClick={openCreate} className="flex items-center gap-1.5 shrink-0">
          <FolderPlus size={15} /> New Folder
        </ElegantButton>
      </div>

      {toast && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 font-lato text-sm text-green-800 dark:border-success/30 dark:bg-success/10 dark:text-success">
          {toast}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Active folders" value={activeCount} />
        <Stat label="Archived folders" value={archivedCount} />
        <Stat label="Books" value={totalBooks} />
        <Stat label="Showing" value={filtered.length} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search folders…"
            aria-label="Search folders"
            className="w-full rounded-lg border border-input bg-form-bg py-2.5 pl-9 pr-3 font-lato text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </div>
        <div className="flex gap-1.5">
          {(['active', 'archived', 'all'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-md border px-3 py-2 font-lato text-xs font-semibold capitalize transition-colors ${
                statusFilter === status
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-transparent text-muted-foreground hover:bg-muted'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={data.length === 0 ? 'No folders yet' : 'No folders match your filters'}
          description={
            data.length === 0
              ? 'Create your first folder to start filing PDF and PowerPoint books.'
              : 'Try a different search or status filter.'
          }
          action={
            data.length === 0 ? (
              <ElegantButton variant="primary" onClick={openCreate} className="text-sm py-2">
                <FolderPlus size={15} /> New Folder
              </ElegantButton>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((folder) => (
            <div key={folder.id} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Folder size={18} />
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/life-sciences/${folder.id}`}
                      className="block truncate font-cinzel text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {folder.name}
                    </Link>
                    <p className="font-lato text-xs text-muted-foreground">
                      {folder.bookCount} book{folder.bookCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 font-lato text-[10px] font-semibold capitalize ${
                    folder.status === 'active'
                      ? 'border-green-200 bg-green-50 text-green-700 dark:border-success/30 dark:bg-success/10 dark:text-success'
                      : 'border-border bg-muted text-muted-foreground'
                  }`}
                >
                  {folder.status}
                </span>
              </div>

              <p className="mb-4 line-clamp-3 flex-1 font-lato text-xs leading-relaxed text-muted-foreground">
                {folder.description || 'No description yet.'}
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/dashboard/life-sciences/${folder.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 font-lato text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <BookCopy size={12} /> Open
                </Link>
                <IconButton label="Edit folder" onClick={() => openEdit(folder)}>
                  <Pencil size={13} />
                </IconButton>
                <IconButton
                  label={folder.status === 'active' ? 'Archive folder' : 'Restore folder'}
                  onClick={() => toggleArchive(folder)}
                  disabled={busyId === folder.id}
                >
                  {folder.status === 'active' ? <Archive size={13} /> : <ArchiveRestore size={13} />}
                </IconButton>
                <IconButton label="Delete folder" onClick={() => remove(folder)} disabled={busyId === folder.id} danger>
                  <Trash2 size={13} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <FolderFormModal
          open
          editing={editing}
          onClose={() => { setFormOpen(false); setEditing(null) }}
          onSaved={(msg) => { showToast(msg); refetch() }}
        />
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="font-cinzel text-xl font-semibold text-foreground">{value}</p>
      <p className="font-lato text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function IconButton({
  label,
  children,
  onClick,
  disabled,
  danger,
}: {
  label: string
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex size-8 items-center justify-center rounded-md border border-border bg-transparent transition-colors disabled:opacity-40 ${
        danger ? 'text-destructive hover:bg-destructive/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
