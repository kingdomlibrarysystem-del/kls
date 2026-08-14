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
  /** Matches a real Resource.id. */
  resourceId: string
  /** Matches a real Chapter.id. */
  chapterId: string
  /** Character offsets into that chapter's `body` string — a real position range, not a decorative flag. */
  startOffset: number
  endOffset: number
  /** Snapshot of the highlighted substring at creation time, so a highlights-list view can render without re-slicing chapter body text on every read. */
  text: string
  color: HighlightColor
  /** ISO date, stamped at creation time. */
  createdAt: string
}
