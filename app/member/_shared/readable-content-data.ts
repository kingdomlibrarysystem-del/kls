/**
 * Chapter-level body content for a readable Resource. Chapters (not raw
 * pages) are the atomic unit here — a scroll's existing `pages: number`
 * field on `Resource` is a physical page *count* used for display only
 * (see resources-data.ts), never a content array; chapters give reading
 * progress a natural, stable unit to track against without inventing a
 * second, disconnected page-numbering scheme.
 */
export interface Chapter {
  id: string
  title: string
  body: string
}

export interface ReadableContent {
  /** Matches the real Resource.id it belongs to. */
  resourceId: string
  chapters: Chapter[]
}
