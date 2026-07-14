export type ReadingStatus = 'READING' | 'COMPLETED'

export interface ReadingProgress {
  /** Matches Resource.id from resources-data.ts. */
  resourceId: string
  status: ReadingStatus
  /** ISO date, stamped when the member first opens the reader for this resource. */
  startedAt: string
  /** Subset of chapter.id from readableContent[resourceId].chapters. */
  completedChapterIds: string[]
  /** Snapshotted from readableContent[resourceId].chapters.length when reading starts. */
  totalChapters: number
  /** The chapter the member was last viewing — resume point for "Continue Reading." */
  lastChapterId: string
  /** ISO date, stamped on every chapter view — drives "recently read" ordering in Phase 6. */
  lastReadAt: string
}

/**
 * Seeded like initialEnrollments (course-catalog-data.ts) — one in-
 * progress and one completed row, so Phase 3/6's "Continue Reading"
 * affordance and reading-history views aren't empty by default on first
 * load. Both reference the 4 resources seeded with real chapter content
 * in readable-content-data.ts.
 */
export const initialReadingProgress: ReadingProgress[] = [
  { resourceId: '1', status: 'READING', startedAt: '2026-06-20', completedChapterIds: ['ch-1'], totalChapters: 3, lastChapterId: 'ch-1', lastReadAt: '2026-06-22' },
  { resourceId: '7', status: 'COMPLETED', startedAt: '2026-05-10', completedChapterIds: ['ch-1', 'ch-2', 'ch-3'], totalChapters: 3, lastChapterId: 'ch-3', lastReadAt: '2026-05-14' },
]
