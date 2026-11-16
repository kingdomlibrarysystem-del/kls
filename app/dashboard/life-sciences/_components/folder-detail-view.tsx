'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  ArchiveRestore,
  AlertTriangle,
  ArrowLeft,
  BookPlus,
  ExternalLink,
  FileText,
  FolderPlus,
  Pencil,
  Presentation,
  Search,
  Trash2,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { isPresentation, type BookFolder, type FolderBook } from '@/lib/data/book-folders'
import {
  useBookFolders,
  useFolderBooks,
  updateFolderBook,
  deleteFolderBook,
} from './use-life-sciences'
import { BookFormModal } from './book-form-modal'
import { FolderFormModal } from './folder-form-modal'

type StatusFilter = 'active' | 'archived' | 'all'

/** A single folder's book list: add, edit, archive, restore, delete and preview documents. */
export function FolderDetailView({ folderId }: { folderId: string }) {
  const folders = useBookFolders({ includeArchived: true })
  const books = useFolderBooks({ folderId, includeArchived: true })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [bookFormOpen, setBookFormOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<FolderBook | null>(null)
  const [folderFormOpen, setFolderFormOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<BookFolder | null>(null)
  const [toast, setToast] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const folder = folders.data.find((f) => f.id === folderId)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 5000)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return books.data.filter((book) => {
      const statusOk = statusFilter === 'all' || book.status === statusFilter
      const searchOk =
        !q || book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q) || book.description.toLowerCase().includes(q)
      return statusOk && searchOk
    })
  }, [books.data, search, statusFilter])

  const openCreate = () => { setEditingBook(null); setBookFormOpen(true) }
  const openEdit = (book: FolderBook) => { setEditingBook(book); setBookFormOpen(true) }

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

  if (folders.loading || books.loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
      </div>
    )
  }

  if (folders.error || books.error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load this folder"
        description={folders.error ?? books.error ?? 'Please try again.'}
      />
    )
  }

  if (!folder) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Folder not found"
        description="This folder may have been deleted."
        action={<ElegantButton variant="outline" className="text-sm py-2" onClick={() => { window.location.href = '/dashboard/life-sciences' }}>Back to folders</ElegantButton>}
      />
    )
  }

  return (
    <div>
      <Link href="/dashboard/life-sciences" className="mb-4 inline-flex items-center gap-1 font-lato text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to folders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-cinzel text-2xl font-semibold text-foreground" style={{ letterSpacing: '1.5px' }}>
            {folder.name}
          </h1>
          <p className="mt-1 max-w-2xl font-lato text-sm text-muted-foreground">
            {folder.description || 'No description yet.'}
          </p>
          <p className="mt-2 font-lato text-xs text-muted-foreground">
            {folder.bookCount} book{folder.bookCount === 1 ? '' : 's'} · {folder.status}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <ElegantButton
            variant="outline"
            onClick={() => { setEditingFolder(null); setFolderFormOpen(true) }}
            className="text-sm py-2 px-4"
          >
            <FolderPlus size={14} /> New Folder
          </ElegantButton>
          <ElegantButton
            variant="outline"
            onClick={() => { setEditingFolder(folder); setFolderFormOpen(true) }}
            className="text-sm py-2 px-4"
          >
            <Pencil size={14} /> Edit folder
          </ElegantButton>
          <ElegantButton variant="primary" onClick={openCreate} className="text-sm py-2 px-4">
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
            placeholder="Search books by title, author or description…"
            aria-label="Search books"
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
          icon={BookPlus}
          title={books.data.length === 0 ? 'No books in this folder yet' : 'No books match your filters'}
          description={
            books.data.length === 0
              ? 'Add a PDF or PowerPoint book to get this folder started.'
              : 'Try a different search or status filter.'
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
              <p className="mb-4 mt-2 line-clamp-3 flex-1 font-lato text-xs leading-relaxed text-muted-foreground">
                {book.description}
              </p>
              <p className="mb-3 font-lato text-[10px] uppercase tracking-wide text-muted-foreground">
                {book.documentType}
              </p>

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

      {bookFormOpen && (
        <BookFormModal
          open
          editing={editingBook}
          folders={folders.data}
          defaultFolderId={folderId}
          onClose={() => { setBookFormOpen(false); setEditingBook(null) }}
          onSaved={(msg) => { showToast(msg); books.refetch(); folders.refetch() }}
        />
      )}

      {folderFormOpen && (
        <FolderFormModal
          open
          editing={editingFolder}
          onClose={() => { setFolderFormOpen(false); setEditingFolder(null) }}
          onSaved={(msg) => { showToast(msg); folders.refetch(); books.refetch() }}
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
