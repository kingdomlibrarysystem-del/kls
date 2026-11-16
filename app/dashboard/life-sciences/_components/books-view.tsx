'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  ArchiveRestore,
  AlertTriangle,
  BookPlus,
  ExternalLink,
  FileText,
  FolderPlus,
  Pencil,
  Presentation,
  Search,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { isPresentation, type FolderBook } from '@/lib/data/book-folders'
import {
  useBookFolders,
  useFolderBooks,
  updateFolderBook,
  deleteFolderBook,
} from './use-life-sciences'
import { BookFormModal } from './book-form-modal'
import { FolderFormModal } from './folder-form-modal'

type StatusFilter = 'active' | 'archived' | 'all'

/** Flat, cross-folder book inventory for the Life Sciences module. */
export function BooksView() {
  const folders = useBookFolders({ includeArchived: true })
  const books = useFolderBooks({ includeArchived: true })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [folderFilter, setFolderFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FolderBook | null>(null)
  const [folderFormOpen, setFolderFormOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 5000)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return books.data.filter((book) => {
      const statusOk = statusFilter === 'all' || book.status === statusFilter
      const folderOk = folderFilter === 'all' || book.folderId === folderFilter
      const searchOk =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q) ||
        (book.folderName ?? '').toLowerCase().includes(q)
      return statusOk && folderOk && searchOk
    })
  }, [books.data, search, statusFilter, folderFilter])

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (book: FolderBook) => { setEditing(book); setFormOpen(true) }

  const toggleArchive = async (book: FolderBook) => {
    setBusyId(book.id)
    try {
      const next = book.status === 'active' ? 'archived' : 'active'
      await updateFolderBook(book.id, { status: next })
      showToast(next === 'archived' ? `"${book.title}" archived.` : `"${book.title}" restored.`)
      books.refetch()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update this book.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (book: FolderBook) => {
    if (!window.confirm(`Delete "${book.title}" permanently? This cannot be undone.`)) return
    setBusyId(book.id)
    try {
      await deleteFolderBook(book.id)
      showToast(`"${book.title}" deleted.`)
      books.refetch()
      folders.refetch()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete this book.')
    } finally {
      setBusyId(null)
    }
  }

  if (books.loading || folders.loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
      </div>
    )
  }

  if (books.error || folders.error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load books"
        description={books.error ?? folders.error ?? 'Please try again.'}
      />
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <PageHeader className="mb-0" title="Life Sciences Books" subtitle="Every document book across all folders." />
        <div className="flex shrink-0 gap-2">
          <ElegantButton variant="outline" onClick={() => setFolderFormOpen(true)} className="flex items-center gap-1.5">
            <FolderPlus size={15} /> New Folder
          </ElegantButton>
          <ElegantButton variant="primary" onClick={openCreate} className="flex items-center gap-1.5">
            <BookPlus size={15} /> Add Book
          </ElegantButton>
        </div>
      </div>

      {toast && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 font-lato text-sm text-green-800 dark:border-success/30 dark:bg-success/10 dark:text-success">
          {toast}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books…"
            aria-label="Search books"
            className="w-full rounded-lg border border-input bg-form-bg py-2.5 pl-9 pr-3 font-lato text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 dark:bg-input/30"
          />
        </div>
        <select
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          aria-label="Filter by folder"
          className="rounded-lg border border-input bg-form-bg px-3 py-2.5 font-lato text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 dark:bg-input/30"
        >
          <option value="all">All folders</option>
          {folders.data.map((folder) => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>
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
          icon={BookPlus}
          title={books.data.length === 0 ? 'No books yet' : 'No books match your filters'}
          description={
            books.data.length === 0
              ? 'Add your first PDF or PowerPoint book.'
              : 'Try a different search, folder or status filter.'
          }
          action={
            books.data.length === 0 ? (
              <ElegantButton variant="primary" onClick={openCreate} className="text-sm py-2">
                <BookPlus size={15} /> Add Book
              </ElegantButton>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <div key={book.id} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isPresentation(book) ? <Presentation size={17} /> : <FileText size={17} />}
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 font-lato text-[10px] font-semibold capitalize ${
                    book.status === 'active'
                      ? 'border-green-200 bg-green-50 text-green-700 dark:border-success/30 dark:bg-success/10 dark:text-success'
                      : 'border-border bg-muted text-muted-foreground'
                  }`}
                >
                  {book.status}
                </span>
              </div>

              <h2 className="font-cinzel text-sm font-semibold leading-snug text-foreground">{book.title}</h2>
              <p className="mt-0.5 font-lato text-xs text-muted-foreground">by {book.author}</p>
              {book.folderName && (
                <Link
                  href={`/dashboard/life-sciences/${book.folderId}`}
                  className="mt-1 font-lato text-[11px] text-primary hover:underline"
                >
                  {book.folderName}
                </Link>
              )}
              <p className="mb-4 mt-2 line-clamp-3 flex-1 font-lato text-xs leading-relaxed text-muted-foreground">
                {book.description}
              </p>
              <p className="mb-3 font-lato text-[10px] uppercase tracking-wide text-muted-foreground">{book.documentType}</p>

              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/member/life-sciences/books/${book.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 font-lato text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <ExternalLink size={12} /> Preview
                </Link>
                <IconButton label="Edit book" onClick={() => openEdit(book)}>
                  <Pencil size={13} />
                </IconButton>
                <IconButton
                  label={book.status === 'active' ? 'Archive book' : 'Restore book'}
                  onClick={() => toggleArchive(book)}
                  disabled={busyId === book.id}
                >
                  {book.status === 'active' ? <Archive size={13} /> : <ArchiveRestore size={13} />}
                </IconButton>
                <IconButton label="Delete book" onClick={() => remove(book)} disabled={busyId === book.id} danger>
                  <Trash2 size={13} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <BookFormModal
          open
          editing={editing}
          folders={folders.data}
          onClose={() => { setFormOpen(false); setEditing(null) }}
          onSaved={(msg) => { showToast(msg); books.refetch(); folders.refetch() }}
        />
      )}

      {folderFormOpen && (
        <FolderFormModal
          open
          editing={null}
          onClose={() => setFolderFormOpen(false)}
          onSaved={(msg) => { showToast(msg); folders.refetch() }}
        />
      )}
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
