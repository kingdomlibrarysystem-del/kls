export interface Note {
  id: string
  /** Matches Resource.id from resources-data.ts. */
  resourceId: string
  /** Matches Chapter.id from readable-content-data.ts. */
  chapterId: string
  /** Set when this note annotates a specific highlight rather than the chapter generally — the "per-highlight" attachment mode. */
  highlightId?: string
  text: string
  /** ISO date, stamped at creation time. */
  createdAt: string
}

/**
 * No seed rows, same reasoning as highlight-data.ts's initialHighlights:
 * a real note is written by a member about a specific chapter/highlight
 * they've actually read, not something safe to fabricate ahead of time.
 */
export const initialNotes: Note[] = []
