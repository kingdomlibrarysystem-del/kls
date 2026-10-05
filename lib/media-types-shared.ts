/**
 * Types + small helpers for admin-managed resource media types, shared by the
 * API, server loaders and client components. Free of Prisma so client code
 * can import it.
 *
 * Media types are DATA (the ResourceMediaType collection, managed at
 * /dashboard/library/media-types) — never a hardcoded list or label map in
 * the UI. Read them with useMediaTypes() on the client or
 * getMediaTypes() on the server.
 */
export interface MediaTypeOption {
  id: string
  /** Stored on Resource.mediaType / Publication.mediaType. Upper-case, no spaces. */
  code: string
  name: string
  description: string | null
  /** Authored chapters (in-app text reader). */
  allowsChapters: boolean
  /** An uploaded document/PDF file. */
  allowsDocument: boolean
  allowsAudio: boolean
  allowsVideo: boolean
  /** One of the original built-in types: can be renamed, not deleted or re-coded. */
  isSystem: boolean
  sortOrder: number
  /** How many resources use this type — only present on the admin list. */
  resourceCount?: number
}

/** What a media type lets a resource contain; all false for an unknown code. */
export interface MediaCapabilities {
  allowsChapters: boolean
  allowsDocument: boolean
  allowsAudio: boolean
  allowsVideo: boolean
}

const NO_CAPABILITIES: MediaCapabilities = { allowsChapters: false, allowsDocument: false, allowsAudio: false, allowsVideo: false }

export function findMediaType(code: string | null | undefined, types: MediaTypeOption[]): MediaTypeOption | undefined {
  return code ? types.find((t) => t.code === code) : undefined
}

/** Display name for a stored code. Falls back to the code itself while the list is loading or if the type was removed. */
export function mediaTypeName(code: string | null | undefined, types: MediaTypeOption[]): string {
  if (!code) return '—'
  return findMediaType(code, types)?.name ?? code
}

export function mediaCapabilities(code: string | null | undefined, types: MediaTypeOption[]): MediaCapabilities {
  return findMediaType(code, types) ?? NO_CAPABILITIES
}

/** "Sermon notes (PDF)" -> "SERMON_NOTES_PDF": the stored code generated from a new type's name. */
export function mediaTypeCodeFromName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}
