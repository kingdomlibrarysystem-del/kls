/**
 * Time limits for assessments, stored as `durationSeconds` on every kind:
 * - QUIZ / TEST / EXAM: minutes to answer (a countdown hands the answers in at 0).
 * - PROJECT: days to complete (shown to members; not a countdown).
 * No value = no time limit.
 */

export const SECONDS_PER_DAY = 86_400

/** "45 min", "1 h 30 min", "7 days", or "No limit" — the same wording in admin and member pages. */
export function formatTimeLimit(kind: string, durationSeconds?: number | null): string {
  if (!durationSeconds || durationSeconds <= 0) return 'No limit'
  if (kind === 'PROJECT') {
    const days = Math.max(1, Math.round(durationSeconds / SECONDS_PER_DAY))
    return `${days} day${days === 1 ? '' : 's'}`
  }
  const minutes = Math.max(1, Math.round(durationSeconds / 60))
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

/** Form value → stored seconds (days for a project, minutes otherwise); empty → undefined (no limit). */
export function toDurationSeconds(kind: string, minutes?: number, days?: number): number | undefined {
  if (kind === 'PROJECT') return days && days > 0 ? Math.round(days * SECONDS_PER_DAY) : undefined
  return minutes && minutes > 0 ? Math.round(minutes * 60) : undefined
}
