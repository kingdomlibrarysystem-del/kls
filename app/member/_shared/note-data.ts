export interface Note {
  id: string
  /** Matches a real Resource.id. */
  resourceId: string
  /** Matches a real Chapter.id. */
  chapterId: string
  /** Set when this note annotates a specific highlight rather than the chapter generally — the "per-highlight" attachment mode. */
  highlightId?: string
  text: string
  /** ISO date, stamped at creation time. */
  createdAt: string
}
