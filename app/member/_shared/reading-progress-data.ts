export type ReadingStatus = 'READING' | 'COMPLETED'

export interface ReadingProgress {
  /** Matches a real Resource.id. */
  resourceId: string
  status: ReadingStatus
  /** ISO date, stamped when the member first opens the reader for this resource. */
  startedAt: string
  /** Subset of chapter.id from the real Chapter rows for this resource. */
  completedChapterIds: string[]
  /** Snapshotted from the resource's chapter count when reading starts. */
  totalChapters: number
  /** The chapter the member was last viewing — resume point for "Continue Reading." */
  lastChapterId: string
  /** ISO date, stamped on every chapter view — drives "recently read" ordering. */
  lastReadAt: string
}
