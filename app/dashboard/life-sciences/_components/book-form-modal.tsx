'use client'

import { useState } from 'react'
import { AlertCircle, BookPlus, FileText } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { FormInput } from '@/components/ui/form-input'
import { Textarea } from '@/components/ui/textarea'
import { FieldLabel } from '@/components/ui/field-label'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { documentTypeFromName, type BookFolder, type FolderBook } from '@/lib/data/book-folders'
import { createFolderBook, updateFolderBook, type FolderBookInput } from './use-life-sciences'

interface BookFormModalProps {
  open: boolean
  editing: FolderBook | null
  folders: BookFolder[]
  defaultFolderId?: string
  onClose: () => void
  onSaved: (message: string) => void
}

/**
 * Add or edit a document-only book. Any document format is accepted; there is
 * deliberately no text editor, audio or video here.
 */
export function BookFormModal({ open, editing, folders, defaultFolderId, onClose, onSaved }: BookFormModalProps) {
  const [folderId, setFolderId] = useState(editing?.folderId ?? defaultFolderId ?? folders[0]?.id ?? '')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [author, setAuthor] = useState(editing?.author ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [documentUrl, setDocumentUrl] = useState(editing?.documentUrl ?? '')
  const [documentName, setDocumentName] = useState(editing?.documentName ?? '')
  const [documentType, setDocumentType] = useState(editing?.documentType ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folderId) return setError('Select a folder for this book.')
    if (!title.trim()) return setError('Title is required.')
    if (!author.trim()) return setError('Author is required.')
    if (!description.trim()) return setError('Description is required.')
    if (!documentUrl) return setError('Upload the book document.')

    const type = (documentType || documentTypeFromName(documentName) || 'FILE').toUpperCase()

    const payload: FolderBookInput = {
      folderId,
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      documentUrl,
      documentName: documentName || (type === 'FILE' ? 'book' : `book.${type.toLowerCase()}`),
      documentType: type,
    }

    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateFolderBook(editing.id, payload)
        onSaved(`Updated "${payload.title}".`)
      } else {
        await createFolderBook(payload)
        onSaved(`Added "${payload.title}".`)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this book — please try again.')
    } finally {
      setSaving(false)
    }
  }

  const activeFolders = folders.filter((f) => f.status === 'active' || f.id === editing?.folderId)

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit Book: ${editing.title}` : 'Add Book'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 font-lato text-xs text-red-700 dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div>
          <FieldLabel htmlFor="book-folder" required>Folder (category)</FieldLabel>
          <select
            id="book-folder"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full rounded-lg border border-input bg-form-bg px-3 py-2.5 font-lato text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            <option value="">Select a folder…</option>
            {activeFolders.map((folder) => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="book-title" required>Title</FieldLabel>
            <FormInput id="book-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" maxLength={200} />
          </div>
          <div>
            <FieldLabel htmlFor="book-author" required>Author</FieldLabel>
            <FormInput id="book-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" maxLength={160} />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="book-description" required>Description</FieldLabel>
          <Textarea
            id="book-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of the book"
            rows={3}
            maxLength={4000}
          />
        </div>

        <div>
          <FieldLabel htmlFor="book-document" required>Document (any format)</FieldLabel>
          <CloudinaryUploadField
            id="book-document"
            accept="*/*"
            label="Upload document"
            kind="document"
            allowAllFormats
            value={documentUrl}
            fileName={documentName}
            onUploaded={({ url, fileName }) => {
              const type = documentTypeFromName(fileName)
              setDocumentUrl(url)
              setDocumentName(fileName)
              setDocumentType(type ?? 'FILE')
            }}
            onClear={() => {
              setDocumentUrl('')
              setDocumentName('')
              setDocumentType('')
            }}
          />
          {documentUrl && documentType && (
            <p className="mt-2 flex items-center gap-1.5 font-lato text-xs text-muted-foreground">
              <FileText size={12} /> {documentType} · {documentName || 'uploaded document'}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <ElegantButton type="submit" variant="primary" loading={saving} loadingText="Saving…" className="flex-1 text-sm py-2">
            <BookPlus size={15} /> {editing ? 'Save Changes' : 'Add Book'}
          </ElegantButton>
          <ElegantButton type="button" variant="outline" onClick={onClose} className="text-sm py-2 px-4">
            Cancel
          </ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
