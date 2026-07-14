/**
 * A small closed set of highlighter colors — real reading apps
 * conventionally offer a few distinct hues so a member can color-code by
 * meaning (e.g. gold for "key verse," green for "promise"). This is a
 * functional multi-value choice, not decoration — same justification the
 * page-builder skill already gives category/status chips — using CSS
 * vars already defined in globals.css rather than inventing new colors.
 */
export type HighlightColor = 'gold' | 'green' | 'teal' | 'pink'

export const highlightColorTokens: Record<HighlightColor, { label: string; background: string; border: string }> = {
  gold: { label: 'Gold', background: 'var(--gold-light)', border: 'var(--gold)' },
  green: { label: 'Green', background: 'var(--green-dim)', border: 'var(--green)' },
  teal: { label: 'Teal', background: 'var(--teal-dim)', border: 'var(--teal)' },
  pink: { label: 'Pink', background: 'var(--pink-dim)', border: 'var(--pink)' },
}

export interface Highlight {
  id: string
  /** Matches Resource.id from resources-data.ts. */
  resourceId: string
  /** Matches Chapter.id from readable-content-data.ts. */
  chapterId: string
  /** Character offsets into that chapter's `body` string — a real position range, not a decorative flag. */
  startOffset: number
  endOffset: number
  /** Snapshot of the highlighted substring at creation time, so a highlights-list view (Phase 6) can render without re-slicing chapter body text on every read. */
  text: string
  color: HighlightColor
  /** ISO date, stamped at creation time. */
  createdAt: string
}

/**
 * No seed rows — a seeded highlight would need to reference exact
 * character offsets into a specific chapter's body text, which would
 * silently desync (highlighting the wrong substring, or throwing on an
 * out-of-range offset) the moment that chapter's placeholder prose is
 * ever edited. Highlights are created only from a real text selection
 * the member makes in the reader, so there's no equivalent-safe way to
 * pre-populate one the way `initialFavorites`/`initialEnrollments` seed
 * rows that don't carry this fragile a dependency.
 */
export const initialHighlights: Highlight[] = []
