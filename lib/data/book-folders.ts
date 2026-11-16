export type FolderStatus = 'active' | 'archived'
export type FolderBookStatus = 'active' | 'archived'

/** A Life Sciences folder (category) as returned by /api/book-folders. */
export interface BookFolder {
  id: string
  name: string
  slug: string
  description: string
  status: FolderStatus
  sortOrder: number
  /** Number of books filed in this folder (all statuses). */
  bookCount: number
  createdAt: string
  updatedAt: string
}

/** A document-only book as returned by /api/folder-books. */
export interface FolderBook {
  id: string
  folderId: string
  folderName?: string
  title: string
  description: string
  author: string
  documentUrl: string
  documentName: string
  /** Uppercased file extension, e.g. "PDF", "PPTX", "DOCX", or "FILE". */
  documentType: string
  documentSize?: number | null
  status: FolderBookStatus
  createdAt: string
  updatedAt: string
}

type FolderRow = {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

type BookRow = {
  id: string
  folderId: string
  title: string
  description: string
  author: string
  documentUrl: string
  documentName: string
  documentType: string
  documentSize: number | null
  status: string
  createdAt: Date
  updatedAt: Date
  folder?: { name: string } | null
}

export function serializeFolder(folder: FolderRow, bookCount = 0): BookFolder {
  return {
    id: folder.id,
    name: folder.name,
    slug: folder.slug,
    description: folder.description ?? '',
    status: folder.status.toLowerCase() as FolderStatus,
    sortOrder: folder.sortOrder,
    bookCount,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  }
}

export function serializeBook(book: BookRow): FolderBook {
  return {
    id: book.id,
    folderId: book.folderId,
    folderName: book.folder?.name,
    title: book.title,
    description: book.description,
    author: book.author,
    documentUrl: book.documentUrl,
    documentName: book.documentName,
    documentType: book.documentType,
    documentSize: book.documentSize,
    status: book.status.toLowerCase() as FolderBookStatus,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
  }
}

/** URL-safe slug from a folder name; collisions are resolved by slugWithSuffix(). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'folder'
}

/**
 * Books accept any document format, so this only derives the extension used
 * for display and previews. Returns null when the name has no extension.
 */
export function documentTypeFromName(name: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec((name ?? '').trim())
  return match ? match[1].toUpperCase() : null
}

/** True when the uploaded file is a PowerPoint presentation. */
export function isPresentation(book: Pick<FolderBook, 'documentType' | 'documentName'>): boolean {
  const type = book.documentType.toUpperCase()
  if (type === 'PPT' || type === 'PPTX') return true
  return /\.(ppt|pptx)$/i.test(book.documentName)
}
